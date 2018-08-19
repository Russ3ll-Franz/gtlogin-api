import { Document } from 'mongoose';

export interface Role extends Document {
    readonly  _id: string;
    readonly name: string;
    readonly descrip: string;
    readonly created_at: number;
    readonly updated_at: number;
}
