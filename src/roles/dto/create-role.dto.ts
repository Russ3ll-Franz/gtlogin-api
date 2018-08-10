import { ApiModelProperty } from '@nestjs/swagger';

export class CreateRoleDto {

    @ApiModelProperty()
    readonly name: string;

    @ApiModelProperty()
    readonly descrip: string;

    @ApiModelProperty()
    readonly created_at: number;

    @ApiModelProperty()
    readonly updated_at: number;

}