import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

/** Thrown when the booking referenced by a review lookup/create doesn't exist. */
export class BookingNotFoundError extends Error {
  constructor(bookingId: string) {
    super(`Booking "${bookingId}" not found.`);
    this.name = "BookingNotFoundError";
  }
}

/** Thrown when the acting user is not the renter of the booking. */
export class ReviewAccessError extends Error {
  constructor(bookingId: string) {
    super(`Booking "${bookingId}" is not reviewable by the acting user.`);
    this.name = "ReviewAccessError";
  }
}

/** Thrown when a review is attempted on a booking that isn't `COMPLETED` yet (BR4). */
export class BookingNotCompletedError extends Error {
  constructor(bookingId: string) {
    super(`Booking "${bookingId}" is not COMPLETED, cannot be reviewed yet.`);
    this.name = "BookingNotCompletedError";
  }
}

/** Thrown when a booking already has a review (unique `bookingId` constraint). */
export class ReviewAlreadyExistsError extends Error {
  constructor(bookingId: string) {
    super(`Booking "${bookingId}" already has a review.`);
    this.name = "ReviewAlreadyExistsError";
  }
}

/** Thrown when the item referenced by a review list lookup doesn't exist. */
export class ItemNotFoundError extends Error {
  constructor(itemId: string) {
    super(`Item "${itemId}" not found.`);
    this.name = "ItemNotFoundError";
  }
}

export interface ReviewDto {
  id: string;
  bookingId: string;
  reviewerId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

type ReviewRecord = Prisma.ReviewGetPayload<Record<string, never>>;

function toReviewDto(review: ReviewRecord): ReviewDto {
  return {
    id: review.id,
    bookingId: review.bookingId,
    reviewerId: review.reviewerId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}

/** `true` when `error` is a Prisma unique-constraint violation (P2002). */
function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export interface CreateReviewInput {
  rating: number;
  comment?: string | null;
}

/**
 * `POST /bookings/:id/review` — Renter reviews a booking after it's finished.
 * Enforces BR4 (`docs/prd.md`): only allowed when `booking.status === "COMPLETED"`,
 * and only by the renter who made the booking. `Review.bookingId` unique
 * constraint additionally guards against double-review races.
 */
export async function createReviewForBooking(
  bookingId: string,
  reviewerId: string,
  input: CreateReviewInput
): Promise<ReviewDto> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new BookingNotFoundError(bookingId);
  }
  if (booking.renterId !== reviewerId) {
    throw new ReviewAccessError(bookingId);
  }
  if (booking.status !== "COMPLETED") {
    throw new BookingNotCompletedError(bookingId);
  }

  try {
    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
    });
    return toReviewDto(review);
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new ReviewAlreadyExistsError(bookingId);
    }
    throw error;
  }
}

/** Looks up the review for a booking, if one exists (`Review.bookingId` is unique). */
export async function getReviewForBooking(bookingId: string): Promise<ReviewDto | null> {
  const review = await prisma.review.findUnique({ where: { bookingId } });
  return review ? toReviewDto(review) : null;
}

export interface ItemReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewer: { id: string; name: string };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * `GET /items/:id/reviews` — public listing of reviews for an item, joined
 * via `Review -> Booking -> Item`, newest first. Reviewer email is
 * intentionally omitted (public endpoint), only `id`/`name` exposed.
 */
export async function listReviewsForItem(
  itemId: string,
  filter: { page: number; limit: number }
): Promise<{ reviews: ItemReviewDto[]; pagination: PaginationMeta }> {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    throw new ItemNotFoundError(itemId);
  }

  const where: Prisma.ReviewWhereInput = { booking: { itemId } };

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      include: { reviewer: true },
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      reviewer: { id: review.reviewer.id, name: review.reviewer.name },
    })),
    pagination: {
      page: filter.page,
      limit: filter.limit,
      total,
      totalPages: Math.max(Math.ceil(total / filter.limit), 1),
    },
  };
}
