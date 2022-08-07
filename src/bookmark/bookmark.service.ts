import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {

    constructor(private prismaService: PrismaService) {

    }

    createBookmark(userId: number, dto: BookmarkDto) {
        return this.prismaService.bookmark.create({
            data: {
                ...dto,
                userId: userId,
            },
        });

    }

    getBookmarks(userId: number) {
        return this.prismaService.bookmark.findMany({
            where: {
                userId: userId
            }
        });
    }

    getBookmarkById(userId: number, bookmarkId: number) {
        return this.prismaService.bookmark.findFirst({
            where: {
                id: bookmarkId,
                userId: userId,
            },
        });
    }

    async editBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
        const bookmark = await this.prismaService.bookmark.findUnique({
            where: {
                id: bookmarkId,
            },
        });
        if (!bookmark || bookmark.userId !== userId) {
            throw new ForbiddenException('Access to resource is denied');
        }

        return this.prismaService.bookmark.update({
            where: {
                id: bookmarkId,
            },
            data: {
                ...dto,
            },
        });
    }

    async deleteBookmarkById(userId: number, bookmarkId: number) {
        const bookmark = await this.prismaService.bookmark.findUnique({
            where: {
                id: bookmarkId,
            },
        });
        if (!bookmark || bookmark.userId !== userId) {
            throw new ForbiddenException('Access to resource is denied');
        }
        return this.prismaService.bookmark.delete({
            where: {
                id: bookmarkId,
            },
        });
    }
}
