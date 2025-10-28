import { Injectable } from '@nestjs/common';
// FIX: Changed to namespace import to resolve module resolution issues.
import * as Prisma from '@prisma/client';

@Injectable()
export class PrismaService extends Prisma.PrismaClient {}