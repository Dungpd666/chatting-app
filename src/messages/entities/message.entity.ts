import {Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn} from "typeorm";
import {Conversation} from "../../conversations/entities/conversation.entity";
import {User} from "../../users/entities/user.entity";

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    conversation_id: number;

    @Column({ nullable: true })
    user_id: number | null;

    @ManyToOne(() => Conversation)
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User | null;

    @Column('text')
    content: string;

    @Column()
    message_type: string;

    @Column()
    created_at: Date;
}
