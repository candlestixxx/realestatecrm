import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Blockchain Smart Contracts API
 * Manages lease agreements and earnest money deposits on-chain.
 * Uses a simplified smart contract simulation for development;
 * production would integrate with Ethereum/Polygon via ethers.js.
 */

interface ContractTemplate {
  type: 'LEASE' | 'EARNEST_MONEY' | 'PURCHASE_AGREEMENT';
  parties: Array<{ role: string; name: string; email: string }>;
  terms: Record<string, any>;
  amount?: number;
  currency?: string;
}

interface DeployedContract {
  contractId: string;
  txHash: string;
  blockNumber: number;
  status: 'PENDING' | 'CONFIRMED' | 'EXECUTED' | 'DISPUTED';
  deployedAt: string;
}

function generateContractHash(template: ContractTemplate): string {
  return crypto.createHash('sha256')
    .update(JSON.stringify(template) + Date.now())
    .digest('hex');
}

function simulateDeploy(template: ContractTemplate): DeployedContract {
  const contractId = '0x' + crypto.randomBytes(20).toString('hex');
  const txHash = '0x' + crypto.randomBytes(32).toString('hex');
  return {
    contractId,
    txHash,
    blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
    status: 'PENDING',
    deployedAt: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { template, workspaceId, action } = body as {
      template: ContractTemplate;
      workspaceId: string;
      action: 'deploy' | 'execute' | 'dispute';
    };

    if (!template || !workspaceId) {
      return NextResponse.json({ error: 'template and workspaceId required' }, { status: 400 });
    }

    switch (action) {
      case 'deploy': {
        const contractHash = generateContractHash(template);
        const deployed = simulateDeploy(template);

        const activity = await prisma.activity.create({
          data: {
            type: 'BLOCKCHAIN_CONTRACT_DEPLOYED',
            workspaceId,
            content: JSON.stringify({
              contractType: template.type,
              contractId: deployed.contractId,
              txHash: deployed.txHash,
              blockNumber: deployed.blockNumber,
              contractHash,
              parties: template.parties,
              terms: template.terms,
              amount: template.amount,
              currency: template.currency || 'USD',
              status: deployed.status,
              deployedAt: deployed.deployedAt
            })
          }
        });

        return NextResponse.json({
          success: true,
          contractId: deployed.contractId,
          txHash: deployed.txHash,
          blockNumber: deployed.blockNumber,
          contractHash,
          status: deployed.status,
          activityId: activity.id
        });
      }

      case 'execute': {
        const { contractId, signature } = body;
        if (!contractId) {
          return NextResponse.json({ error: 'contractId required' }, { status: 400 });
        }

        const txHash = '0x' + crypto.randomBytes(32).toString('hex');
        await prisma.activity.create({
          data: {
            type: 'BLOCKCHAIN_CONTRACT_EXECUTED',
            workspaceId,
            content: JSON.stringify({
              contractId,
              txHash,
              signature,
              executedAt: new Date().toISOString()
            })
          }
        });

        return NextResponse.json({
          success: true,
          contractId,
          txHash,
          status: 'EXECUTED',
          executedAt: new Date().toISOString()
        });
      }

      case 'dispute': {
        const { contractId, reason } = body;
        if (!contractId) {
          return NextResponse.json({ error: 'contractId required' }, { status: 400 });
        }

        await prisma.activity.create({
          data: {
            type: 'BLOCKCHAIN_CONTRACT_DISPUTED',
            workspaceId,
            content: JSON.stringify({
              contractId,
              reason,
              disputedAt: new Date().toISOString()
            })
          }
        });

        return NextResponse.json({
          success: true,
          contractId,
          status: 'DISPUTED'
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Blockchain contract error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const contractType = searchParams.get('type');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const where: any = {
      workspaceId,
      type: { startsWith: 'BLOCKCHAIN_CONTRACT' }
    };
    if (contractType) {
      where.content = { contains: contractType };
    }

    const contracts = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      contracts: contracts.map((c: any) => ({
        activityId: c.id,
        ...JSON.parse(c.content),
        loggedAt: c.createdAt
      })),
      total: contracts.length
    });
  } catch (error) {
    console.error('Blockchain contract fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
