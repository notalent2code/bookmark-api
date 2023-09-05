import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class BookmarkService {
  constructor(private readonly prisma: PrismaService) {}

  getBookmarks(userId: number) {
    return this.prisma.bookmark.findMany({
      where: { userId },
    });
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id: bookmarkId, userId },
    });

    if (!bookmark) {
      throw new ForbiddenException('Access denied');
    }

    return bookmark;
  }

  createBookmark(userId: number, dto: CreateBookmarkDto) {
    return this.prisma.bookmark.create({
      data: {
        ...dto,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async editBookmark(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
    await this.getBookmarkById(userId, bookmarkId);

    return this.prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        ...dto,
      },
    });
  }

  async deleteBookmark(userId: number, bookmarkId: number) {
    await this.getBookmarkById(userId, bookmarkId);

    return this.prisma.bookmark.delete({
      where: { id: bookmarkId, userId },
    });
  }
}
