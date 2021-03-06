import { Document } from 'mongoose';
import { Token } from './token.interface';

export interface User extends Document {
    readonly  _id: string;
    readonly name: string;
    readonly surname: string;
    readonly lastname: string;
    readonly password: string;
    email: string;
    readonly tokens: Token[];
    readonly roles: string[];
    readonly groups: string[];
    readonly email_verified: boolean;
    logged_in: boolean;
    last_login: number;
    last_logout: number;
    readonly created_at: number;
    readonly updated_at: number;
}
