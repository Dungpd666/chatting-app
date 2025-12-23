import {Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn} from "typeorm";
import {Conversation} from "../../conversations/entities/conversation.entity";
import {User} from "../../users/entities/user.entity";

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    conversation_id: number;

    @Column()
    user_id: number;

    @ManyToOne(() => Conversation)
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column('text')
    content: string;

    @Column()
    message_type: string;

    @Column()
    created_at: Date;
}
