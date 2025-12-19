import {Column, Entity, ManyToOne, JoinColumn} from "typeorm";
import {Conversation} from "../../conversations/entities/conversation.entity";
import {User} from "../../users/entities/user.entity";

@Entity('conversation_members')
export class ConversationMember {
    @Column({ primary: true })
    conversation_id: number;

    @Column({ primary: true })
    user_id: number;

    @ManyToOne(() => Conversation)
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    joined_at: Date;

    @Column({ nullable: true })
    last_seen_at: Date;

    @Column()
    is_admin: boolean;
}
