export class CreateMessageDto {
    conversation_id: number;
    content?: string;
    message_type: 'text' | 'image' | 'file';
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
    attachment_size?: number;
}
