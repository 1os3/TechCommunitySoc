import { Model, Sequelize } from 'sequelize';
import { Models } from './index';
export interface ViolationWordAttributes {
    id: number;
    word: string;
    is_regex: boolean;
    is_active: boolean;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}
export interface ViolationWordCreationAttributes extends Omit<ViolationWordAttributes, 'id' | 'created_at' | 'updated_at'> {
}
declare class ViolationWord extends Model<ViolationWordAttributes, ViolationWordCreationAttributes> implements ViolationWordAttributes {
    id: number;
    word: string;
    is_regex: boolean;
    is_active: boolean;
    created_by: number;
    readonly created_at: Date;
    readonly updated_at: Date;
    static associate(models: Models): void;
    toJSON(): Partial<ViolationWordAttributes>;
}
export declare const initViolationWord: (sequelize: Sequelize) => typeof ViolationWord;
export default ViolationWord;
//# sourceMappingURL=ViolationWord.d.ts.map