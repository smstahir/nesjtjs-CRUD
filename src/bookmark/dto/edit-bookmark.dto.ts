import { Optional } from "@nestjs/common";
import { IsString } from "class-validator";

export class EditBookmarkDto {
    @IsString()
    @Optional()
    title?: string;

    @IsString()
    @Optional()
    link?: string;

    @IsString()
    @Optional()
    description?: string;
}