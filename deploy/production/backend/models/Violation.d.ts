import { Model, Sequelize } from 'sequelize';
import { Models } from './index';
export interface ViolationAttributes {
    id: number;
    user_id: number;
    content_type: 'post' | 'comment';
    content_id: number;
    violation_word_id: number;
    matched_text: string;
    content_snippet: string;
    detected_at: Date;
    status: 'pending' | 'reviewed' | 'ignored';
    reviewed_by?: number;
    reviewed_at?: Date;
    notes?: string;
}
export interface ViolationCreationAttributes extends Omit<ViolationAttributes, 'id' | 'detected_at' | 'reviewed_by' | 'reviewed_at' | 'notes'> {
}
declare class Violation extends Model<ViolationAttributes, ViolationCreationAttributes> implements ViolationAttributes {
    id: number;
    user_id: number;
    content_type: 'post' | 'comment';
    content_id: number;
    violation_word_id: number;
    matched_text: string;
    content_snippet: string;
    readonly detected_at: Date;
    status: 'pending' | 'reviewed' | 'ignored';
    reviewed_by?: number;
    reviewed_at?: Date;
    notes?: string;
    static associate(models: Models): void;
    toJSON(): Partial<ViolationAttributes>;
}
export declare const initViolation: (sequelize: Sequelize) => typeof Violation;
export default Violation;
//# sourceMappingURL=Violation.d.ts.map