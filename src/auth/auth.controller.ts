import { Controller, Post, HttpStatus, Response, Body, Param, Request,
         UnprocessableEntityException, BadRequestException, InternalServerErrorException, UseGuards, NotFoundException, 
         Req, ReflectMetadata, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiOperation, ApiResponse, ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from 'users/dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import * as _ from 'lodash';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RejectTokenDto } from './dto/reject-token.dto';
import { User } from 'users/interfaces/user.interface';
import { UserDataDto } from './dto/user-data.dto';

@ApiUseTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService) {}

  @Post('login')
  @ApiOperation({ title: 'Login a user with username/email and password.'})
  @ApiResponse({ status: 200, description: 'The user is loggedin.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  async loginUser(@Response() res: any, @Body() body: LoginUserDto) {
    if (!(body && body.email && body.password)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Username and password are required!' });
    }

    const user = await this.usersService.getUserByEmail(body.email.toLowerCase());

    if (user) {
      res.set('user', user);
      if (await this.usersService.compareHash(body.password, user.password)) {
        return res.status(HttpStatus.OK).json(await this.authService.createToken(user['id'], user.email.toLowerCase()));
      }
    }

    return res.status(HttpStatus.FORBIDDEN).json({ message: 'Username or password wrong!' });
  }

  @Post('register')
  @ApiOperation({ title: 'Registers a new user.'})
  @ApiResponse({ status: 200, description: 'The user has been created.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  @ApiResponse({ status: 422, description: 'Entity Validation Error.'})
  async registerUser(@Body() body: CreateUserDto) {
    try{
        return await this.usersService.create(body);
    } catch (e) {
      const message = e.message;
      console.log(e);
      if ( e.name === 'ValidationError' ){
          throw new UnprocessableEntityException(message);
      }else if ( e.response.error === 'ENTITY_VALIDATION_ERROR' ){
          throw new UnprocessableEntityException(message);
      } else {
          throw new InternalServerErrorException();
      }
    }
  }

  @Post('userData')
  @ApiOperation({ title: 'Get user data if loggedin.'})
  @ApiResponse({ status: 200, description: 'The data has been retrieved.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  async getUserData(@Response() res: any, @Body() body: UserDataDto): Promise<User> {
    if (!(body && body.email)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email is required!' });
    }
    try {
        const user = await this.authService.getUserLoggedIn(body.email.toLowerCase());
        if ( !user ) {
          throw new NotFoundException('User not found');
        }
        return res.status(HttpStatus.OK).json(user);

    } catch (e){
        const message = e.message.message;
        if ( e.message.error === 'NOT_FOUND'){
            throw new NotFoundException(message);
        } else if ( e.message.error === 'ID_NOT_VALID'){
            throw new BadRequestException(message);
        } else if ( e.message.error === 'FORBIDDEN'){
            throw new ForbiddenException(message);
        }
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('bearer'))
  @ApiOperation({ title: 'Logout a user.'})
  @ApiResponse({ status: 200, description: 'The user has been logout.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  async logout(@Req() request: Request): Promise<any> {
    // return `This action removes a #${id} user`;
    const token = _.replace(request.headers['authorization'], 'bearer ', '');
    try {
        return await this.usersService.removeToken(token);
    } catch (e) {
        const message = e.message;
        if ( e.message.error === 'NOT_FOUND'){
            throw new NotFoundException(message);
        } else if ( e.message.error === 'TOKEN_NOT_VALID'){
            throw new BadRequestException(message);
        }
    }
  }

  @Post('logout/:token')
  @UseGuards(AuthGuard('bearer'))
  @ReflectMetadata('data', { resource: 'auth', method: 'logoutByToken' })
  @ApiOperation({ title: 'Logout a user with access token.'})
  @ApiResponse({ status: 200, description: 'The user has been logout.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  async removeToken(@Param('token') token: string): Promise<any> {
    // return `This action removes a #${id} user`;
    try {
        return await this.usersService.removeToken(token);
    } catch (e){
        const message = e.message;
        if ( e.message.error === 'NOT_FOUND'){
            throw new NotFoundException(message);
        } else if ( e.message.error === 'TOKEN_NOT_VALID'){
            throw new BadRequestException(message);
        }
    }
  }

  @Post('token')
  @UseGuards(AuthGuard('bearer'))
  @ReflectMetadata('data', { resource: 'auth', method: 'createToken' })
  @ApiOperation({ title: 'Renew access token if refresh token exists for an user.'})
  @ApiResponse({ status: 200, description: 'The token was generated.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  async generateToken(@Response() res: any, @Body() body: RefreshTokenDto): Promise<any> {
    if (!(body && body.email && body.refreshToken)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Username and refresh token are required!' });
    }

    const user = await this.usersService.getUserByEmail(body.email);

    if (user) {
        res.set('user', user);
        return res.status(HttpStatus.OK).json(await this.authService.createToken(user['id'], user.email.toLowerCase()));
    }

    return res.status(HttpStatus.FORBIDDEN).json({ message: 'Username or password wrong!' });
  }

  @Post('token/reject')
  @UseGuards(AuthGuard('bearer'))
  @ReflectMetadata('data', { resource: 'auth', method: 'rejectToken' })
  @ApiOperation({ title: 'Reject refresh token.'})
  @ApiResponse({ status: 204, description: 'The token was generated.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  async rejectToken(@Response() res: any, @Body() body: RejectTokenDto): Promise<any> {
    if (!(body && body.token)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Token is required!' });
    }
    console.log('VALIDANDO REJECT_TOKEN');

    const user = await this.authService.removeToken(body.token);

    return res.status(HttpStatus.FORBIDDEN).json({ message: 'Token wrong!' });
  }

}