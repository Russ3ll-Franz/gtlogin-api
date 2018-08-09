import { Token } from './interfaces/token.interface';
import * as bcrypt from 'bcryptjs';
import * as moment from 'moment';
import * as _ from 'lodash';
import * as jwt from 'jsonwebtoken';

import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectID } from 'mongodb';

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  saltRounds: any;
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  // CREATE
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const createdUser = new this.userModel(createUserDto);
      let User = await createdUser.save();
      User = _.pick(User, ['_id', 'name', 'surname', 'lastname', 'email', 'created_at', 'update_at']);
      return User;
    } catch (e) {
        return e;
    }
  }

  // FINDALL
  async findAll(): Promise<User[]> {
    return await this.userModel.find();
  }

  // FINDONE
  async findOne(id: string): Promise<User> {
      if ( !ObjectID.isValid(id) ){
        throw new HttpException({error: 'ID_NOT_VALID', message: `ID ${id} is not valid`, status: HttpStatus.NOT_FOUND}, 400);
      }
      try {

      return this.userModel.findOne({
        _id: id,
      }).then( (res) => {
        if ( !res ) {
          throw new HttpException({ error: 'NOT_FOUND', message: `ID ${id} not found`, status: HttpStatus.NOT_FOUND}, 404);
        }
        return res;
      } );

    } catch (e) {
      throw e;
    }
  }

  // FIND BY EMAIL
  async getUserByEmail(user_email: string): Promise<User> {
    try {
      return await this.userModel.findOne({
        email: user_email,
      }).then( (res) => {
        if ( !res ) {
          throw new HttpException({ error: 'NOT_FOUND', message: `${user_email} not found`, status: HttpStatus.NOT_FOUND}, 404);
        }
        const User = _.pick(res, ['_id', 'name', 'surname', 'lastname', 'email', 'password', 'tokens', 'created_at', 'update_at']);
        return User;
      } );
    } catch (e) {
      throw e;
    }
  }

  // FIND BY TOKEN
  async getUserByToken(token: string): Promise<User> {
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        // return new Promise((resolve, reject) => {
        //     reject();
        // });

        return Promise.reject();
    }
    const User = await this.userModel.findOne({
      'email': decoded.user.email,
      'tokens.access': 'auth',
      'tokens.token': token,
    });
    return User;

  }

  // UPDATE
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
      if ( !ObjectID.isValid(id) ){
        throw new HttpException({error: 'ID_NOT_VALID', message: `ID ${id} is not valid`, status: HttpStatus.BAD_REQUEST}, 400);
      }
      try {
          const date = moment().valueOf();
          updateUserDto.updated_at = date;
          const resp = await this.userModel.updateOne({
            _id: id,
          }, {
            $set: updateUserDto,
          });
          if ( resp.nModified === 0 ){
            throw new HttpException({ error: 'NOT_FOUND', message: `ID ${id} not found or entity not modified`, status: HttpStatus.NOT_FOUND}, 404);
          } else {
            let User = await this.userModel.findOne({ _id: id });
            User = _.pick(User, ['_id', 'name', 'surname', 'lastname', 'email', 'created_at', 'update_at']);
            return User;
          }
      } catch (e) {
        if ( e.message.error === 'NOT_FOUND' ){
          throw new HttpException({ error: 'NOT_FOUND', message: `ID ${id} not found or entity not modified`, status: HttpStatus.NOT_FOUND}, 404);
        } else {
          throw new HttpException({error: 'ID_NOT_VALID', message: `ID ${id} is not valid`, status: HttpStatus.BAD_REQUEST}, 400);
        }
      }
  }

  // DELETE
  async delete(id: string): Promise<User> {
    if ( !ObjectID.isValid(id) ){
      throw new HttpException({error: 'ID_NOT_VALID', message: `ID ${id} is not valid`, status: HttpStatus.BAD_REQUEST}, 400);
    }
    try {
      let User = await this.userModel.findOneAndRemove({
        _id: id,
      });
      if ( !User ) {
          throw new HttpException({ error: 'NOT_FOUND', message: `ID ${id} not found`, status: HttpStatus.NOT_FOUND}, 404);
      }
      User = _.pick(User, ['_id', 'name', 'surname', 'lastname', 'email']);
      return User;
    } catch (e) {
      if ( e.message.error === 'NOT_FOUND' ){
        throw new HttpException({ error: 'NOT_FOUND', message: `ID ${id} not found`, status: HttpStatus.NOT_FOUND}, 404);
      } else {
        throw new HttpException({error: 'ID_NOT_VALID', message: `ID ${id} is not valid`, status: HttpStatus.BAD_REQUEST}, 400);
      }
    }

  }

  // USERS SELF DATA
  async me() {
    // return this.userModel
  }

  async getHash(password: string): Promise<string>  {
    this.saltRounds = 16;
    return bcrypt.hash(password, this.saltRounds);
  }

  async compareHash(password, hash): Promise<boolean>  {
    return bcrypt.compare(password, hash);
  }

  async findUserExistsByEmail(user_email: string): Promise<User> {
    return this.userModel.findOne({
      email: user_email,
    }).then( (res) => {
      if ( res ) {
        return true;
      }
      return false;
    } );
  }

  async removeToken(token: string) {
    return await this.userModel.update({
        $pull: {
            tokens: { token },
        },
    });
  }
}