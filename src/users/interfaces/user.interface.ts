import { Document } from 'mongoose';

export interface User extends Document {
    readonly name: string;
    readonly surname: string;
    readonly lastname: string;
    readonly password: string;
    readonly email: string;
    readonly tokens: string;
    readonly created_at: number;
    readonly updated_at: number;
}
