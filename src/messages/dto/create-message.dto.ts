export class CreateMessageDto {
    conversation_id: number;
    content: string;
    message_type: 'text' | 'image' | 'file';
}
