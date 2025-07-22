export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare class EmailService {
    private static transporter;
    static initialize(): Promise<void>;
    static sendEmail(options: EmailOptions): Promise<boolean>;
    static sendVerificationEmail(email: string, token: string): Promise<boolean>;
    static sendPasswordResetEmail(email: string, token: string): Promise<boolean>;
}
//# sourceMappingURL=emailService.d.ts.map