import {CanActivate, ExecutionContext, Injectable} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {WsException} from "@nestjs/websockets";

@Injectable()
export class WsJwtGuard implements CanActivate{
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client = context.switchToWs().getClient();
            const token = client.handshake?.auth?.token ||
                                client.handshake?.headers?.authorization?.split(' ')[1];
            if (!token) {
                throw new WsException('Token not found');
            }

            client.data.user = this.jwtService.verify(token);
            return true;
        } catch (error) {
            throw new WsException('Invalid token');
        }
    }
}