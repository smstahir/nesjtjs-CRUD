import { Optional } from "@nestjs/common";
import { IsNotEmpty, IsString } from "class-validator";

export class BookmarkDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    link: string;

    @Optional()
    @IsString()
    description?: string;
}