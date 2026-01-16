import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    last_message_at: Date;

    @Column()
    created_at: Date;
}
