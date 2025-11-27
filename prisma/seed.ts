import { Role } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { systemRole: true },
  });

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
    
    // Ensure admin has system role
    if (!existingAdmin.systemRole) {
      await prisma.systemRole.create({
        data: {
          userId: existingAdmin.id,
          role: Role.ADMIN,
          grantedBy: existingAdmin.id, // Self-granted for seed
        },
      });
      console.log(`✅ System ADMIN role granted to existing user: ${adminEmail}`);
    } else {
      console.log(`✅ Admin user already has system role: ${adminEmail}`);
    }
  } else {
    // Create new admin user
    const passwordHash = await hashPassword(adminPassword);
    
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'System Administrator',
        emailVerified: true, // Auto-verify for seed admin
        emailVerifiedAt: new Date(),
      },
    });

    // Grant system ADMIN role
    await prisma.systemRole.create({
      data: {
        userId: adminUser.id,
        role: Role.ADMIN,
        grantedBy: adminUser.id, // Self-granted for seed
      },
    });

    console.log(`✅ Created admin user: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  Please change the password after first login!`);
  }

  // Create sample project (optional)
  if (process.env.CREATE_SAMPLE_PROJECT === 'true') {
    const sampleProject = await prisma.project.findFirst({
      where: { name: 'Sample Project' },
    });

    if (!sampleProject) {
      const admin = await prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (admin) {
        const project = await prisma.project.create({
          data: {
            name: 'Sample Project',
            description: 'A sample project for testing',
            isPublic: false,
            createdBy: admin.id,
          },
        });

        // Add admin as project member with ADMIN role
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: admin.id,
            role: Role.ADMIN,
            invitedBy: admin.id,
          },
        });

        console.log(`✅ Created sample project: ${project.name}`);
      }
    } else {
      console.log(`✅ Sample project already exists`);
    }
  }

  console.log('✅ Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
