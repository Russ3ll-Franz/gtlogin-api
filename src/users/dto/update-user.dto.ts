import { ApiModelProperty } from '@nestjs/swagger';

export class UpdateUserDto {

    @ApiModelProperty()
    readonly name: string;

    @ApiModelProperty()
    readonly surname: string;

    @ApiModelProperty()
    readonly lastname: string;

    @ApiModelProperty()
    readonly roles: ArrayList<any>;

    @ApiModelProperty()
    updated_at: number;

}