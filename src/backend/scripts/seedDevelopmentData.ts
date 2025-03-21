import { PrismaClient } from '@prisma/client'; // v4.14.0
import { faker } from '@faker-js/faker'; // v8.0.0
import * as bcrypt from 'bcrypt'; // v5.1.0
import * as dotenv from 'dotenv'; // v16.0.3
import { UserRole } from '../src/utils/constants/roles';
import { DEFAULT_MEETING_STAGES } from '../src/utils/constants/meetingStages';
import { METRIC_UNITS, METRIC_DEFAULT_COLORS } from '../src/utils/constants/metricTypes';
import { logger } from '../src/utils/helpers/logger';
import { addDays, addMonths, addYears } from '../src/utils/helpers/dateTimeHelper';

/**
 * Main function that orchestrates the database seeding process
 */
async function main(): Promise<void> {
  // Load environment variables
  dotenv.config();

  // Create Prisma client
  const prisma = new PrismaClient();

  try {
    logger.info('Starting database seed process...');
    
    // Seed the database
    await seed(prisma);
    
    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
}

/**
 * Seeds the database with development data
 * @param prisma Prisma client instance
 */
async function seed(prisma: PrismaClient): Promise<void> {
  // Clear existing data
  await clearDatabase(prisma);
  logger.info('Database cleared');

  // Create organizations
  const organizations = await createOrganizations(prisma);
  logger.info(`Created ${Object.keys(organizations).length} organizations`);

  // Create users with different roles
  const users = await createUsers(prisma, organizations);
  logger.info(`Created ${Object.keys(users).length} users`);

  // Create teams and assign users
  const teams = await createTeams(prisma, organizations, users);
  logger.info(`Created ${Object.keys(teams).length} teams`);

  // Create strategic goals
  const goals = await createGoals(prisma, organizations);
  logger.info(`Created ${Object.keys(goals).length} goals`);

  // Create metrics
  const metrics = await createMetrics(prisma, organizations, teams, users, goals);
  logger.info(`Created ${Object.keys(metrics).length} metrics`);

  // Create KFFM structures
  const kffm = await createKFFM(prisma, organizations, users, metrics);
  logger.info(`Created ${Object.keys(kffm).length} KFFM structures`);

  // Create meetings
  const meetings = await createMeetings(prisma, organizations, users);
  logger.info(`Created ${Object.keys(meetings).length} meetings`);

  // Create action items
  const actionItems = await createActionItems(prisma, organizations, users, meetings);
  logger.info(`Created ${Object.keys(actionItems).length} action items`);

  // Create notifications
  const notifications = await createNotifications(prisma, organizations, users, meetings, actionItems);
  logger.info(`Created ${Object.keys(notifications).length} notifications`);
}

/**
 * Clears all existing data from the database tables
 * @param prisma Prisma client instance
 */
async function clearDatabase(prisma: PrismaClient): Promise<void> {
  // Delete in reverse order of dependencies to respect foreign key constraints
  await prisma.notificationDelivery.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.actionItem.deleteMany({});
  await prisma.meetingParticipant.deleteMany({});
  await prisma.meetingStage.deleteMany({});
  await prisma.meetingNote.deleteMany({});
  await prisma.meeting.deleteMany({});
  await prisma.kffmNodeMetric.deleteMany({});
  await prisma.kffmConnection.deleteMany({});
  await prisma.kffmNode.deleteMany({});
  await prisma.kffm.deleteMany({});
  await prisma.metricValue.deleteMany({});
  await prisma.metricThreshold.deleteMany({});
  await prisma.metricGoal.deleteMany({});
  await prisma.metric.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  
  logger.info('All database tables cleared');
}

/**
 * Creates sample organizations with different settings
 * @param prisma Prisma client instance
 * @returns Object containing created organizations for reference
 */
async function createOrganizations(prisma: PrismaClient): Promise<Record<string, any>> {
  const organizations: Record<string, any> = {};

  // Create a standard organization
  organizations.acme = await prisma.organization.create({
    data: {
      name: 'Acme Inc.',
      settings: {
        theme: 'light',
        features: {
          calendarIntegration: true,
          metricNotifications: true
        }
      }
    }
  });

  // Create organization with Google Calendar integration
  organizations.globalTech = await prisma.organization.create({
    data: {
      name: 'Global Tech Solutions',
      settings: {
        theme: 'dark',
        features: {
          calendarIntegration: true,
          metricNotifications: true
        },
        calendarIntegration: {
          provider: 'google',
          enabled: true
        }
      }
    }
  });

  // Create organization with Microsoft Calendar integration
  organizations.innovateX = await prisma.organization.create({
    data: {
      name: 'InnovateX',
      settings: {
        theme: 'light',
        features: {
          calendarIntegration: true,
          metricNotifications: true
        },
        calendarIntegration: {
          provider: 'microsoft',
          enabled: true
        }
      }
    }
  });

  // Create organization with custom branding
  organizations.quantum = await prisma.organization.create({
    data: {
      name: 'Quantum Dynamics',
      settings: {
        theme: 'custom',
        features: {
          calendarIntegration: false,
          metricNotifications: true
        },
        branding: {
          primaryColor: '#3F51B5',
          secondaryColor: '#FF4081',
          logoUrl: 'https://example.com/logo.png'
        }
      }
    }
  });

  return organizations;
}

/**
 * Creates sample users with different roles and authentication methods
 * @param prisma Prisma client instance
 * @param organizations Created organizations
 * @returns Object containing created users for reference
 */
async function createUsers(
  prisma: PrismaClient,
  organizations: Record<string, any>
): Promise<Record<string, any>> {
  const users: Record<string, any> = {};
  
  // Create a coach user with access to multiple organizations
  const coachPassword = await generatePassword('coach123');
  users.coach = await prisma.user.create({
    data: {
      email: 'coach@metronomics.io',
      firstName: 'Shannon',
      lastName: 'Susko',
      name: 'Shannon Susko', // Combined name
      role: UserRole.COACH,
      status: 'ACTIVE',
      organizationId: null, // Coaches can access multiple organizations
      authId: faker.string.uuid(), // Simulating a Firebase auth ID
      authProvider: 'EMAIL_PASSWORD',
      photoURL: faker.image.avatar(),
      passwordHash: coachPassword,
      preferences: {
        theme: 'light',
        timezone: 'America/New_York',
        notificationPreferences: {
          email: true,
          inApp: true,
          push: true,
          meetingReminders: true,
          actionItems: true,
          metricAlerts: true,
          teamUpdates: true,
          digestFrequency: 'daily'
        },
        dashboardLayout: {},
        customFields: {}
      },
      isActive: true,
      lastLoginAt: faker.date.recent()
    }
  });
  
  // Create CEO users for each organization
  for (const [orgKey, org] of Object.entries(organizations)) {
    const ceoPassword = await generatePassword('ceo123');
    const ceoKey = `ceo_${orgKey}`;
    users[ceoKey] = await prisma.user.create({
      data: {
        email: `ceo@${orgKey.toLowerCase()}.com`,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        role: UserRole.CEO,
        status: 'ACTIVE',
        organizationId: org.id,
        authId: faker.string.uuid(),
        authProvider: orgKey === 'acme' ? 'EMAIL_PASSWORD' : 
                      orgKey === 'globalTech' ? 'GOOGLE' : 'MICROSOFT',
        photoURL: faker.image.avatar(),
        passwordHash: orgKey === 'acme' ? ceoPassword : null,
        preferences: {
          theme: 'light',
          timezone: 'America/New_York',
          notificationPreferences: {
            email: true,
            inApp: true,
            push: true,
            meetingReminders: true,
            actionItems: true,
            metricAlerts: true,
            teamUpdates: true,
            digestFrequency: 'daily'
          },
          dashboardLayout: {},
          customFields: {}
        },
        isActive: true,
        lastLoginAt: faker.date.recent()
      }
    });
    
    // Create leadership users
    for (let i = 0; i < 3; i++) {
      const leadershipPassword = await generatePassword('leadership123');
      const leaderKey = `leader_${orgKey}_${i}`;
      users[leaderKey] = await prisma.user.create({
        data: {
          email: `leadership${i}@${orgKey.toLowerCase()}.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          role: UserRole.LEADERSHIP,
          status: 'ACTIVE',
          organizationId: org.id,
          authId: faker.string.uuid(),
          authProvider: 'EMAIL_PASSWORD',
          photoURL: faker.image.avatar(),
          passwordHash: leadershipPassword,
          preferences: {
            theme: 'light',
            timezone: 'America/New_York',
            notificationPreferences: {
              email: true,
              inApp: true,
              push: true,
              meetingReminders: true,
              actionItems: true,
              metricAlerts: true,
              teamUpdates: true,
              digestFrequency: 'daily'
            },
            dashboardLayout: {},
            customFields: {}
          },
          isActive: true,
          lastLoginAt: faker.date.recent()
        }
      });
    }
    
    // Create team member users
    for (let i = 0; i < 8; i++) {
      const teamMemberPassword = await generatePassword('member123');
      const memberKey = `member_${orgKey}_${i}`;
      users[memberKey] = await prisma.user.create({
        data: {
          email: `member${i}@${orgKey.toLowerCase()}.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          role: UserRole.TEAM_MEMBER,
          status: 'ACTIVE',
          organizationId: org.id,
          authId: faker.string.uuid(),
          authProvider: 'EMAIL_PASSWORD',
          photoURL: faker.image.avatar(),
          passwordHash: teamMemberPassword,
          preferences: {
            theme: 'light',
            timezone: 'America/New_York',
            notificationPreferences: {
              email: true,
              inApp: true,
              push: false,
              meetingReminders: true,
              actionItems: true,
              metricAlerts: false,
              teamUpdates: true,
              digestFrequency: 'weekly'
            },
            dashboardLayout: {},
            customFields: {}
          },
          isActive: i < 6, // Some inactive users
          lastLoginAt: i < 6 ? faker.date.recent() : null
        }
      });
    }
    
    // Create viewer users
    for (let i = 0; i < 2; i++) {
      const viewerPassword = await generatePassword('viewer123');
      const viewerKey = `viewer_${orgKey}_${i}`;
      users[viewerKey] = await prisma.user.create({
        data: {
          email: `viewer${i}@${orgKey.toLowerCase()}.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          role: UserRole.VIEWER,
          status: 'ACTIVE',
          organizationId: org.id,
          authId: faker.string.uuid(),
          authProvider: 'EMAIL_PASSWORD',
          photoURL: faker.image.avatar(),
          passwordHash: viewerPassword,
          preferences: {
            theme: 'light',
            timezone: 'America/New_York',
            notificationPreferences: {
              email: false,
              inApp: true,
              push: false,
              meetingReminders: false,
              actionItems: false,
              metricAlerts: false,
              teamUpdates: false,
              digestFrequency: 'never'
            },
            dashboardLayout: {},
            customFields: {}
          },
          isActive: true,
          lastLoginAt: faker.date.recent()
        }
      });
    }
  }
  
  return users;
}

/**
 * Creates sample teams and assigns users as team members
 * @param prisma Prisma client instance
 * @param organizations Created organizations
 * @param users Created users
 * @returns Object containing created teams for reference
 */
async function createTeams(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  users: Record<string, any>
): Promise<Record<string, any>> {
  const teams: Record<string, any> = {};
  
  // Common team names
  const teamNames = ['Marketing', 'Sales', 'Product', 'Engineering', 'Finance', 'HR', 'Customer Success'];
  
  // Create teams for each organization
  for (const [orgKey, org] of Object.entries(organizations)) {
    // Get leadership users for this organization
    const leadershipUsers = Object.values(users).filter(
      (user: any) => user.organizationId === org.id && user.role === UserRole.LEADERSHIP
    );
    
    // Get team member users for this organization
    const teamMemberUsers = Object.values(users).filter(
      (user: any) => user.organizationId === org.id && user.role === UserRole.TEAM_MEMBER
    );
    
    // Use leadership users as team leads, one for each team
    const teamCount = Math.min(teamNames.length, leadershipUsers.length);
    
    for (let i = 0; i < teamCount; i++) {
      const teamKey = `${orgKey}_${teamNames[i].toLowerCase()}`;
      
      // Create team
      teams[teamKey] = await prisma.team.create({
        data: {
          name: teamNames[i],
          description: `${teamNames[i]} team for ${org.name}`,
          organizationId: org.id
        }
      });
      
      // Add team lead (from leadership)
      await prisma.teamMember.create({
        data: {
          teamId: teams[teamKey].id,
          userId: leadershipUsers[i].id,
          role: 'LEAD'
        }
      });
      
      // Add team members (2-4 per team)
      const membersPerTeam = faker.number.int({ min: 2, max: 4 });
      const availableMembers = [...teamMemberUsers]; // Copy to avoid modifying original
      
      for (let j = 0; j < membersPerTeam && availableMembers.length > 0; j++) {
        // Pick a random member that hasn't been assigned yet
        const randomIndex = faker.number.int({ min: 0, max: availableMembers.length - 1 });
        const member = availableMembers.splice(randomIndex, 1)[0];
        
        await prisma.teamMember.create({
          data: {
            teamId: teams[teamKey].id,
            userId: member.id,
            role: 'MEMBER'
          }
        });
      }
    }
  }
  
  return teams;
}

/**
 * Creates sample strategic goals and milestones
 * @param prisma Prisma client instance
 * @param organizations Created organizations
 * @returns Object containing created goals for reference
 */
async function createGoals(
  prisma: PrismaClient,
  organizations: Record<string, any>
): Promise<Record<string, any>> {
  const goals: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    // Create BHAG (Big Hairy Audacious Goal) - long-term (10+ years)
    const bhagKey = `bhag_${orgKey}`;
    goals[bhagKey] = await prisma.goal.create({
      data: {
        type: 'BHAG',
        title: orgKey === 'acme' ? 'Become a $1B global company by 2030' :
                orgKey === 'globalTech' ? 'Achieve 100M active users by 2035' :
                orgKey === 'innovateX' ? 'Revolutionize industry with 50% market share by 2032' :
                'Be recognized as the leader in quantum computing solutions by 2033',
        description: 'Our long-term vision that guides all strategic decisions',
        startDate: new Date(),
        endDate: addYears(new Date(), 10),
        status: 'ACTIVE',
        organizationId: org.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create 3HAG (3-Year Highly Achievable Goal)
    const threeHagKey = `3hag_${orgKey}`;
    goals[threeHagKey] = await prisma.goal.create({
      data: {
        type: '3HAG',
        title: orgKey === 'acme' ? 'Reach $50M annual revenue with 20% EBITDA by EOY 2025' :
                orgKey === 'globalTech' ? 'Expand to 5 new markets with 10M users by 2024' :
                orgKey === 'innovateX' ? 'Launch 3 new product lines with 30% growth by 2024' :
                'Develop and patent 5 quantum algorithms by 2024',
        description: 'Our 3-year strategic goal that supports our BHAG',
        startDate: new Date(),
        endDate: addYears(new Date(), 3),
        status: 'ACTIVE',
        organizationId: org.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create 1HAG (1-Year Highly Achievable Goal)
    const oneHagKey = `1hag_${orgKey}`;
    goals[oneHagKey] = await prisma.goal.create({
      data: {
        type: '1HAG',
        title: orgKey === 'acme' ? 'Increase revenue to $20M with 15% profit margin' :
                orgKey === 'globalTech' ? 'Reach 5M active users with 80% retention' :
                orgKey === 'innovateX' ? 'Launch mobile platform with 100K users' :
                'Complete phase 1 of quantum research with successful prototype',
        description: 'Our 1-year strategic goal that supports our 3HAG',
        startDate: new Date(),
        endDate: addYears(new Date(), 1),
        status: 'ACTIVE',
        organizationId: org.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create quarterly goals
    for (let i = 0; i < 4; i++) {
      const quarterKey = `q${i+1}_${orgKey}`;
      goals[quarterKey] = await prisma.goal.create({
        data: {
          type: 'QUARTERLY',
          title: orgKey === 'acme' ? `Q${i+1}: Reach ${4 + i}M revenue with ${13 + i}% margin` :
                  orgKey === 'globalTech' ? `Q${i+1}: Add ${250000 * (i+1)} new users` :
                  orgKey === 'innovateX' ? `Q${i+1}: Complete ${['design', 'development', 'testing', 'launch'][i]} phase` :
                  `Q${i+1}: Achieve milestone ${i+1} in quantum research`,
          description: `Our Q${i+1} goal that supports our 1HAG`,
          startDate: addMonths(new Date(), i * 3),
          endDate: addMonths(new Date(), (i + 1) * 3),
          status: i === 0 ? 'ACTIVE' : 'PENDING',
          organizationId: org.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Create milestones for 3HAG
    const threeHagMilestones = [
      { title: 'Year 1 Target', dueDate: addYears(new Date(), 1) },
      { title: 'Year 2 Target', dueDate: addYears(new Date(), 2) },
      { title: 'Year 3 Target', dueDate: addYears(new Date(), 3) }
    ];
    
    for (const milestone of threeHagMilestones) {
      await prisma.milestone.create({
        data: {
          title: milestone.title,
          description: `Milestone for ${milestone.title}`,
          dueDate: milestone.dueDate,
          status: 'PENDING',
          goalId: goals[threeHagKey].id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Create milestones for 1HAG
    const oneHagMilestones = [
      { title: 'Q1 Target', dueDate: addMonths(new Date(), 3) },
      { title: 'Q2 Target', dueDate: addMonths(new Date(), 6) },
      { title: 'Q3 Target', dueDate: addMonths(new Date(), 9) },
      { title: 'Q4 Target', dueDate: addMonths(new Date(), 12) }
    ];
    
    for (const milestone of oneHagMilestones) {
      await prisma.milestone.create({
        data: {
          title: milestone.title,
          description: `Milestone for ${milestone.title}`,
          dueDate: milestone.dueDate,
          status: 'PENDING',
          goalId: goals[oneHagKey].id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }
  
  return goals;
}

/**
 * Creates sample metrics, metric values, and thresholds
 * @param prisma Prisma client instance
 * @param organizations Created organizations
 * @param teams Created teams
 * @param users Created users
 * @param goals Created goals
 * @returns Object containing created metrics for reference
 */
async function createMetrics(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  teams: Record<string, any>,
  users: Record<string, any>,
  goals: Record<string, any>
): Promise<Record<string, any>> {
  const metrics: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    // Get team member users for this organization
    const teamMemberUsers = Object.values(users).filter(
      (user: any) => user.organizationId === org.id && user.role === UserRole.TEAM_MEMBER
    );
    
    // Financial metrics
    const revenueKey = `revenue_${orgKey}`;
    metrics[revenueKey] = await prisma.metric.create({
      data: {
        name: 'Revenue',
        description: 'Total company revenue',
        unit: METRIC_UNITS.CURRENCY_USD,
        comparisonType: 'YEAR_TO_DATE',
        calculationMethod: 'SUM',
        organizationId: org.id,
        teamId: Object.values(teams).find((t: any) => 
          t.name === 'Finance' && t.organizationId === org.id
        )?.id || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create metric values for revenue (12 months of history)
    const revenueValues = generateFakeMetricValues(
      metrics[revenueKey].id,
      teamMemberUsers[0].id,
      'REVENUE',
      1000000, // Start at $1M
      12, // 12 months of history
      0.05 // 5% volatility
    );
    
    await prisma.metricValue.createMany({
      data: revenueValues
    });
    
    // Create metric thresholds for revenue
    await prisma.metricThreshold.createMany({
      data: [
        {
          metricId: metrics[revenueKey].id,
          thresholdType: 'TARGET',
          value: 1500000,
          color: METRIC_DEFAULT_COLORS.TARGET,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[revenueKey].id,
          thresholdType: 'WARNING',
          value: 1200000,
          color: METRIC_DEFAULT_COLORS.WARNING,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[revenueKey].id,
          thresholdType: 'CRITICAL',
          value: 1000000,
          color: METRIC_DEFAULT_COLORS.CRITICAL,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });
    
    // Profit margin metric
    const profitMarginKey = `profit_margin_${orgKey}`;
    metrics[profitMarginKey] = await prisma.metric.create({
      data: {
        name: 'Profit Margin',
        description: 'Profit as a percentage of revenue',
        unit: METRIC_UNITS.PERCENTAGE,
        comparisonType: 'YEAR_TO_DATE',
        calculationMethod: 'AVERAGE',
        organizationId: org.id,
        teamId: Object.values(teams).find((t: any) => 
          t.name === 'Finance' && t.organizationId === org.id
        )?.id || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create metric values for profit margin (12 months of history)
    const profitMarginValues = generateFakeMetricValues(
      metrics[profitMarginKey].id,
      teamMemberUsers[1].id,
      'PERCENTAGE',
      15, // Start at 15%
      12, // 12 months of history
      0.1 // 10% volatility
    );
    
    await prisma.metricValue.createMany({
      data: profitMarginValues
    });
    
    // Create metric thresholds for profit margin
    await prisma.metricThreshold.createMany({
      data: [
        {
          metricId: metrics[profitMarginKey].id,
          thresholdType: 'TARGET',
          value: 20,
          color: METRIC_DEFAULT_COLORS.TARGET,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[profitMarginKey].id,
          thresholdType: 'WARNING',
          value: 15,
          color: METRIC_DEFAULT_COLORS.WARNING,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[profitMarginKey].id,
          thresholdType: 'CRITICAL',
          value: 10,
          color: METRIC_DEFAULT_COLORS.CRITICAL,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });
    
    // Customer metrics
    const customerSatisfactionKey = `csat_${orgKey}`;
    metrics[customerSatisfactionKey] = await prisma.metric.create({
      data: {
        name: 'Customer Satisfaction',
        description: 'Average customer satisfaction score',
        unit: METRIC_UNITS.PERCENTAGE,
        comparisonType: 'MONTH_TO_MONTH',
        calculationMethod: 'AVERAGE',
        organizationId: org.id,
        teamId: Object.values(teams).find((t: any) => 
          t.name === 'Customer Success' && t.organizationId === org.id
        )?.id || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create metric values for customer satisfaction (12 months of history)
    const csatValues = generateFakeMetricValues(
      metrics[customerSatisfactionKey].id,
      teamMemberUsers[2].id,
      'PERCENTAGE',
      85, // Start at 85%
      12, // 12 months of history
      0.05 // 5% volatility
    );
    
    await prisma.metricValue.createMany({
      data: csatValues
    });
    
    // Create metric thresholds for customer satisfaction
    await prisma.metricThreshold.createMany({
      data: [
        {
          metricId: metrics[customerSatisfactionKey].id,
          thresholdType: 'TARGET',
          value: 90,
          color: METRIC_DEFAULT_COLORS.TARGET,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[customerSatisfactionKey].id,
          thresholdType: 'WARNING',
          value: 80,
          color: METRIC_DEFAULT_COLORS.WARNING,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[customerSatisfactionKey].id,
          thresholdType: 'CRITICAL',
          value: 70,
          color: METRIC_DEFAULT_COLORS.CRITICAL,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });
    
    // Customer acquisition metric
    const customerAcquisitionKey = `new_customers_${orgKey}`;
    metrics[customerAcquisitionKey] = await prisma.metric.create({
      data: {
        name: 'New Customers',
        description: 'Number of new customers acquired',
        unit: METRIC_UNITS.COUNT,
        comparisonType: 'MONTH_TO_MONTH',
        calculationMethod: 'SUM',
        organizationId: org.id,
        teamId: Object.values(teams).find((t: any) => 
          t.name === 'Sales' && t.organizationId === org.id
        )?.id || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create metric values for customer acquisition (12 months of history)
    const customerAcquisitionValues = generateFakeMetricValues(
      metrics[customerAcquisitionKey].id,
      teamMemberUsers[3].id,
      'COUNT',
      50, // Start at 50 new customers per month
      12, // 12 months of history
      0.15 // 15% volatility
    );
    
    await prisma.metricValue.createMany({
      data: customerAcquisitionValues
    });
    
    // Create metric thresholds for customer acquisition
    await prisma.metricThreshold.createMany({
      data: [
        {
          metricId: metrics[customerAcquisitionKey].id,
          thresholdType: 'TARGET',
          value: 75,
          color: METRIC_DEFAULT_COLORS.TARGET,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[customerAcquisitionKey].id,
          thresholdType: 'WARNING',
          value: 50,
          color: METRIC_DEFAULT_COLORS.WARNING,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[customerAcquisitionKey].id,
          thresholdType: 'CRITICAL',
          value: 25,
          color: METRIC_DEFAULT_COLORS.CRITICAL,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });
    
    // Link metrics to goals
    // Revenue metric to 1HAG and 3HAG
    await prisma.metricGoal.createMany({
      data: [
        {
          metricId: metrics[revenueKey].id,
          goalId: goals[`1hag_${orgKey}`].id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[revenueKey].id,
          goalId: goals[`3hag_${orgKey}`].id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });
    
    // Profit margin metric to 1HAG and 3HAG
    await prisma.metricGoal.createMany({
      data: [
        {
          metricId: metrics[profitMarginKey].id,
          goalId: goals[`1hag_${orgKey}`].id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[profitMarginKey].id,
          goalId: goals[`3hag_${orgKey}`].id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });
    
    // Customer metrics to quarterly goals
    await prisma.metricGoal.createMany({
      data: [
        {
          metricId: metrics[customerSatisfactionKey].id,
          goalId: goals[`q1_${orgKey}`].id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          metricId: metrics[customerAcquisitionKey].id,
          goalId: goals[`q2_${orgKey}`].id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });
  }
  
  return metrics;
}

/**
 * Creates sample Key Function Flow Maps with nodes and connections
 * @param prisma Prisma client instance
 * @param organizations Created organizations
 * @param users Created users
 * @param metrics Created metrics
 * @returns Object containing created KFFM structures for reference
 */
async function createKFFM(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  users: Record<string, any>,
  metrics: Record<string, any>
): Promise<Record<string, any>> {
  const kffm: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    // Create KFFM structure
    const kffmKey = `kffm_${orgKey}`;
    kffm[kffmKey] = await prisma.kffm.create({
      data: {
        title: `${org.name} Function Flow Map`,
        version: 1,
        status: 'ACTIVE',
        organizationId: org.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Get the CEO for this organization
    const ceo = Object.values(users).find(
      (user: any) => user.organizationId === org.id && user.role === UserRole.CEO
    );
    
    // Get leadership users for this organization
    const leadershipUsers = Object.values(users).filter(
      (user: any) => user.organizationId === org.id && user.role === UserRole.LEADERSHIP
    );
    
    // Common department/function structure
    const departments = [
      { name: 'Executive', functions: ['Strategy', 'Governance'] },
      { name: 'Marketing', functions: ['Brand', 'Digital Marketing', 'Content'] },
      { name: 'Sales', functions: ['Lead Generation', 'Account Management', 'Channel Partners'] },
      { name: 'Product', functions: ['Product Strategy', 'UX Design', 'Product Management'] },
      { name: 'Engineering', functions: ['Development', 'QA', 'DevOps'] },
      { name: 'Finance', functions: ['Accounting', 'Financial Planning', 'Treasury'] },
      { name: 'HR', functions: ['Recruitment', 'Training', 'Culture'] },
      { name: 'Customer Success', functions: ['Support', 'Implementation', 'Training'] }
    ];
    
    // Create nodes for each department and function
    const nodes: Record<string, any> = {};
    
    // Executive department (owned by CEO)
    const executiveDept = departments[0];
    nodes[`dept_${executiveDept.name}`] = await prisma.kffmNode.create({
      data: {
        kffmId: kffm[kffmKey].id,
        title: executiveDept.name,
        description: `${executiveDept.name} Department`,
        type: 'DEPARTMENT',
        positionX: 500,
        positionY: 100,
        ownerId: ceo?.id || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create function nodes for executive department
    for (let i = 0; i < executiveDept.functions.length; i++) {
      const funcName = executiveDept.functions[i];
      nodes[`func_${executiveDept.name}_${funcName}`] = await prisma.kffmNode.create({
        data: {
          kffmId: kffm[kffmKey].id,
          title: funcName,
          description: `${funcName} Function`,
          type: 'FUNCTION',
          positionX: 300 + (i * 400),
          positionY: 250,
          ownerId: ceo?.id || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Connect function to department
      await prisma.kffmConnection.create({
        data: {
          kffmId: kffm[kffmKey].id,
          sourceNodeId: nodes[`dept_${executiveDept.name}`].id,
          targetNodeId: nodes[`func_${executiveDept.name}_${funcName}`].id,
          label: 'includes',
          type: 'HIERARCHY',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Create the other departments (owned by leadership)
    for (let d = 1; d < departments.length && d - 1 < leadershipUsers.length; d++) {
      const dept = departments[d];
      const leader = leadershipUsers[d - 1];
      
      // Create department node
      nodes[`dept_${dept.name}`] = await prisma.kffmNode.create({
        data: {
          kffmId: kffm[kffmKey].id,
          title: dept.name,
          description: `${dept.name} Department`,
          type: 'DEPARTMENT',
          positionX: (d % 3) * 400 + 300,
          positionY: Math.floor(d / 3) * 400 + 500,
          ownerId: leader?.id || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Connect department to executive
      await prisma.kffmConnection.create({
        data: {
          kffmId: kffm[kffmKey].id,
          sourceNodeId: nodes[`dept_${executiveDept.name}`].id,
          targetNodeId: nodes[`dept_${dept.name}`].id,
          label: 'oversees',
          type: 'HIERARCHY',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Create function nodes for this department
      for (let f = 0; f < dept.functions.length; f++) {
        const funcName = dept.functions[f];
        nodes[`func_${dept.name}_${funcName}`] = await prisma.kffmNode.create({
          data: {
            kffmId: kffm[kffmKey].id,
            title: funcName,
            description: `${funcName} Function`,
            type: 'FUNCTION',
            positionX: (d % 3) * 400 + 200 + (f * 150),
            positionY: Math.floor(d / 3) * 400 + 600,
            ownerId: leader?.id || null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Connect function to department
        await prisma.kffmConnection.create({
          data: {
            kffmId: kffm[kffmKey].id,
            sourceNodeId: nodes[`dept_${dept.name}`].id,
            targetNodeId: nodes[`func_${dept.name}_${funcName}`].id,
            label: 'includes',
            type: 'HIERARCHY',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }
    
    // Create some cross-functional connections
    // Marketing -> Sales
    if (nodes[`dept_Marketing`] && nodes[`dept_Sales`]) {
      await prisma.kffmConnection.create({
        data: {
          kffmId: kffm[kffmKey].id,
          sourceNodeId: nodes[`dept_Marketing`].id,
          targetNodeId: nodes[`dept_Sales`].id,
          label: 'supports',
          type: 'PROCESS',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Product -> Engineering
    if (nodes[`dept_Product`] && nodes[`dept_Engineering`]) {
      await prisma.kffmConnection.create({
        data: {
          kffmId: kffm[kffmKey].id,
          sourceNodeId: nodes[`dept_Product`].id,
          targetNodeId: nodes[`dept_Engineering`].id,
          label: 'defines requirements for',
          type: 'PROCESS',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Engineering -> Customer Success
    if (nodes[`dept_Engineering`] && nodes[`dept_Customer Success`]) {
      await prisma.kffmConnection.create({
        data: {
          kffmId: kffm[kffmKey].id,
          sourceNodeId: nodes[`dept_Engineering`].id,
          targetNodeId: nodes[`dept_Customer Success`].id,
          label: 'delivers to',
          type: 'PROCESS',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Link metrics to relevant nodes
    // Revenue metric to Sales department
    const revenueMetric = Object.values(metrics).find(
      (m: any) => m.name === 'Revenue' && m.organizationId === org.id
    );
    
    if (revenueMetric && nodes[`dept_Sales`]) {
      await prisma.kffmNodeMetric.create({
        data: {
          nodeId: nodes[`dept_Sales`].id,
          metricId: revenueMetric.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Customer Satisfaction to Customer Success
    const csatMetric = Object.values(metrics).find(
      (m: any) => m.name === 'Customer Satisfaction' && m.organizationId === org.id
    );
    
    if (csatMetric && nodes[`dept_Customer Success`]) {
      await prisma.kffmNodeMetric.create({
        data: {
          nodeId: nodes[`dept_Customer Success`].id,
          metricId: csatMetric.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // New Customers to Sales
    const newCustomersMetric = Object.values(metrics).find(
      (m: any) => m.name === 'New Customers' && m.organizationId === org.id
    );
    
    if (newCustomersMetric && nodes[`dept_Sales`]) {
      await prisma.kffmNodeMetric.create({
        data: {
          nodeId: nodes[`dept_Sales`].id,
          metricId: newCustomersMetric.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }
  
  return kffm;
}

/**
 * Creates sample meetings with participants and stages
 * @param prisma Prisma client instance
 * @param organizations Created organizations
 * @param users Created users
 * @returns Object containing created meetings for reference
 */
async function createMeetings(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  users: Record<string, any>
): Promise<Record<string, any>> {
  const meetings: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    // Get all users for this organization
    const orgUsers = Object.values(users).filter(
      (user: any) => user.organizationId === org.id && user.isActive
    );
    
    // Get leadership users for this organization
    const leadershipUsers = orgUsers.filter(
      (user: any) => user.role === UserRole.LEADERSHIP
    );
    
    // Get the CEO for this organization
    const ceo = orgUsers.find(
      (user: any) => user.role === UserRole.CEO
    );
    
    // Create daily huddle meetings
    for (let i = 0; i < 5; i++) {
      const meetingDate = addDays(new Date(), i - 3); // 3 past, 1 today, 1 future
      const meetingKey = `daily_${orgKey}_${i}`;
      
      meetings[meetingKey] = await prisma.meeting.create({
        data: {
          title: `Daily Huddle - ${meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          description: 'Quick daily sync to align priorities and address blockers',
          meetingType: 'DAILY',
          status: i < 3 ? 'COMPLETED' : i === 3 ? 'IN_PROGRESS' : 'SCHEDULED',
          startTime: new Date(meetingDate.setHours(9, 0, 0, 0)),
          endTime: new Date(meetingDate.setHours(9, 30, 0, 0)),
          currentStage: i === 3 ? 'PRIORITIES' : null,
          organizationId: org.id,
          createdById: ceo?.id || leadershipUsers[0]?.id,
          createdAt: addDays(new Date(), i - 10),
          updatedAt: i < 3 ? addDays(new Date(), i - 3) : new Date(),
          completedAt: i < 3 ? addDays(new Date(), i - 3) : null
        }
      });
      
      // Add participants
      // CEO as moderator
      if (ceo) {
        await prisma.meetingParticipant.create({
          data: {
            meetingId: meetings[meetingKey].id,
            userId: ceo.id,
            role: 'MODERATOR',
            attendanceStatus: 'ACCEPTED',
            joinedAt: i <= 3 ? meetings[meetingKey].startTime : null,
            leftAt: i < 3 ? meetings[meetingKey].endTime : null,
            createdAt: addDays(new Date(), i - 10),
            updatedAt: new Date()
          }
        });
      }
      
      // Leadership team as participants
      for (const leader of leadershipUsers.slice(0, 3)) {
        await prisma.meetingParticipant.create({
          data: {
            meetingId: meetings[meetingKey].id,
            userId: leader.id,
            role: 'PARTICIPANT',
            attendanceStatus: 'ACCEPTED',
            joinedAt: i <= 3 ? meetings[meetingKey].startTime : null,
            leftAt: i < 3 ? meetings[meetingKey].endTime : null,
            createdAt: addDays(new Date(), i - 10),
            updatedAt: new Date()
          }
        });
      }
      
      // Create meeting stages
      for (const stage of DEFAULT_MEETING_STAGES.DAILY) {
        await prisma.meetingStage.create({
          data: {
            meetingId: meetings[meetingKey].id,
            stageType: stage.stageType,
            content: i < 3 ? faker.lorem.paragraph() : '',
            sequence: stage.sequence,
            startedAt: i < 3 && stage.sequence <= 5 ? 
                       addMinutes(meetings[meetingKey].startTime, stage.sequence * 5) : 
                       i === 3 && stage.sequence <= 3 ? 
                       addMinutes(meetings[meetingKey].startTime, stage.sequence * 5) : 
                       null,
            completedAt: i < 3 && stage.sequence <= 5 ? 
                         addMinutes(meetings[meetingKey].startTime, (stage.sequence + 1) * 5) : 
                         i === 3 && stage.sequence < 3 ? 
                         addMinutes(meetings[meetingKey].startTime, (stage.sequence + 1) * 5) : 
                         null,
            createdAt: addDays(new Date(), i - 10),
            updatedAt: new Date()
          }
        });
      }
    }
    
    // Create weekly review meetings
    for (let i = 0; i < 3; i++) {
      const meetingDate = addDays(new Date(), (i - 2) * 7); // 2 past, 1 future
      const meetingKey = `weekly_${orgKey}_${i}`;
      
      meetings[meetingKey] = await prisma.meeting.create({
        data: {
          title: `Weekly Review - Week ${getWeekNumber(meetingDate)}`,
          description: 'Weekly team review to assess progress, metrics, and adjust priorities',
          meetingType: 'WEEKLY',
          status: i < 2 ? 'COMPLETED' : 'SCHEDULED',
          startTime: new Date(meetingDate.setHours(14, 0, 0, 0)),
          endTime: new Date(meetingDate.setHours(15, 30, 0, 0)),
          currentStage: null,
          organizationId: org.id,
          createdById: ceo?.id || leadershipUsers[0]?.id,
          createdAt: addDays(new Date(), (i - 3) * 7),
          updatedAt: i < 2 ? addDays(new Date(), (i - 2) * 7) : new Date(),
          completedAt: i < 2 ? addDays(new Date(), (i - 2) * 7) : null
        }
      });
      
      // Add participants
      // CEO as moderator
      if (ceo) {
        await prisma.meetingParticipant.create({
          data: {
            meetingId: meetings[meetingKey].id,
            userId: ceo.id,
            role: 'MODERATOR',
            attendanceStatus: 'ACCEPTED',
            joinedAt: i < 2 ? meetings[meetingKey].startTime : null,
            leftAt: i < 2 ? meetings[meetingKey].endTime : null,
            createdAt: addDays(new Date(), (i - 3) * 7),
            updatedAt: new Date()
          }
        });
      }
      
      // All leadership team as participants
      for (const leader of leadershipUsers) {
        await prisma.meetingParticipant.create({
          data: {
            meetingId: meetings[meetingKey].id,
            userId: leader.id,
            role: 'PARTICIPANT',
            attendanceStatus: 'ACCEPTED',
            joinedAt: i < 2 ? meetings[meetingKey].startTime : null,
            leftAt: i < 2 ? meetings[meetingKey].endTime : null,
            createdAt: addDays(new Date(), (i - 3) * 7),
            updatedAt: new Date()
          }
        });
      }
      
      // Add some team members
      const teamMembers = orgUsers.filter(
        (user: any) => user.role === UserRole.TEAM_MEMBER
      ).slice(0, 3);
      
      for (const member of teamMembers) {
        await prisma.meetingParticipant.create({
          data: {
            meetingId: meetings[meetingKey].id,
            userId: member.id,
            role: 'PARTICIPANT',
            attendanceStatus: faker.helpers.arrayElement(['ACCEPTED', 'TENTATIVE']),
            joinedAt: i < 2 ? meetings[meetingKey].startTime : null,
            leftAt: i < 2 ? meetings[meetingKey].endTime : null,
            createdAt: addDays(new Date(), (i - 3) * 7),
            updatedAt: new Date()
          }
        });
      }
      
      // Create meeting stages
      for (const stage of DEFAULT_MEETING_STAGES.WEEKLY) {
        await prisma.meetingStage.create({
          data: {
            meetingId: meetings[meetingKey].id,
            stageType: stage.stageType,
            content: i < 2 ? faker.lorem.paragraphs(2) : '',
            sequence: stage.sequence,
            startedAt: i < 2 ? 
                       addMinutes(meetings[meetingKey].startTime, stage.sequence * 10) : 
                       null,
            completedAt: i < 2 ? 
                         addMinutes(meetings[meetingKey].startTime, (stage.sequence + 1) * 10) : 
                         null,
            createdAt: addDays(new Date(), (i - 3) * 7),
            updatedAt: new Date()
          }
        });
      }
    }
    
    // Create quarterly planning meeting
    const quarterlyMeetingDate = addDays(new Date(), -30); // In the past
    const quarterlyMeetingKey = `quarterly_${orgKey}`;
    
    meetings[quarterlyMeetingKey] = await prisma.meeting.create({
      data: {
        title: `Quarterly Planning - Q${Math.floor(quarterlyMeetingDate.getMonth() / 3) + 1}`,
        description: 'Quarterly strategic planning session to review progress and set priorities for the upcoming quarter',
        meetingType: 'QUARTERLY',
        status: 'COMPLETED',
        startTime: new Date(quarterlyMeetingDate.setHours(9, 0, 0, 0)),
        endTime: new Date(quarterlyMeetingDate.setHours(16, 0, 0, 0)),
        currentStage: null,
        organizationId: org.id,
        createdById: ceo?.id || leadershipUsers[0]?.id,
        createdAt: addDays(new Date(), -45),
        updatedAt: addDays(new Date(), -30),
        completedAt: addDays(new Date(), -30)
      }
    });
    
    // Add all leadership and CEO as participants
    if (ceo) {
      await prisma.meetingParticipant.create({
        data: {
          meetingId: meetings[quarterlyMeetingKey].id,
          userId: ceo.id,
          role: 'MODERATOR',
          attendanceStatus: 'ACCEPTED',
          joinedAt: meetings[quarterlyMeetingKey].startTime,
          leftAt: meetings[quarterlyMeetingKey].endTime,
          createdAt: addDays(new Date(), -45),
          updatedAt: new Date()
        }
      });
    }
    
    for (const leader of leadershipUsers) {
      await prisma.meetingParticipant.create({
        data: {
          meetingId: meetings[quarterlyMeetingKey].id,
          userId: leader.id,
          role: 'PARTICIPANT',
          attendanceStatus: 'ACCEPTED',
          joinedAt: meetings[quarterlyMeetingKey].startTime,
          leftAt: meetings[quarterlyMeetingKey].endTime,
          createdAt: addDays(new Date(), -45),
          updatedAt: new Date()
        }
      });
    }
    
    // Add some team members as observers
    const teamMembers = orgUsers.filter(
      (user: any) => user.role === UserRole.TEAM_MEMBER
    ).slice(0, 5);
    
    for (const member of teamMembers) {
      await prisma.meetingParticipant.create({
        data: {
          meetingId: meetings[quarterlyMeetingKey].id,
          userId: member.id,
          role: 'OBSERVER',
          attendanceStatus: 'ACCEPTED',
          joinedAt: meetings[quarterlyMeetingKey].startTime,
          leftAt: meetings[quarterlyMeetingKey].endTime,
          createdAt: addDays(new Date(), -45),
          updatedAt: new Date()
        }
      });
    }
    
    // Create meeting stages with content
    for (const stage of DEFAULT_MEETING_STAGES.QUARTERLY) {
      await prisma.meetingStage.create({
        data: {
          meetingId: meetings[quarterlyMeetingKey].id,
          stageType: stage.stageType,
          content: faker.lorem.paragraphs(3),
          sequence: stage.sequence,
          startedAt: addMinutes(meetings[quarterlyMeetingKey].startTime, stage.sequence * 60),
          completedAt: addMinutes(meetings[quarterlyMeetingKey].startTime, (stage.sequence + 1) * 60),
          createdAt: addDays(new Date(), -45),
          updatedAt: new Date()
        }
      });
    }
  }
  
  return meetings;
}

/**
 * Creates sample action items assigned to users
 * @param prisma Prisma client instance
 * @param organizations Created organizations
 * @param users Created users
 * @param meetings Created meetings
 * @returns Object containing created action items for reference
 */
async function createActionItems(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  users: Record<string, any>,
  meetings: Record<string, any>
): Promise<Record<string, any>> {
  const actionItems: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    // Get all users for this organization
    const orgUsers = Object.values(users).filter(
      (user: any) => user.organizationId === org.id && user.isActive
    );
    
    // Get meetings for this organization
    const orgMeetings = Object.values(meetings).filter(
      (meeting: any) => meeting.organizationId === org.id
    );
    
    // Get completed meetings
    const completedMeetings = orgMeetings.filter(
      (meeting: any) => meeting.status === 'COMPLETED'
    );
    
    // Create action items for completed meetings
    let actionItemCounter = 0;
    
    for (const meeting of completedMeetings) {
      // Create 2-5 action items per meeting
      const actionItemCount = faker.number.int({ min: 2, max: 5 });
      
      for (let i = 0; i < actionItemCount; i++) {
        const assignee = faker.helpers.arrayElement(orgUsers);
        const dueDate = addDays(meeting.endTime, faker.number.int({ min: 1, max: 14 }));
        const isPastDue = dueDate < new Date();
        
        // Determine status based on due date and randomness
        let status;
        if (isPastDue) {
          status = faker.helpers.arrayElement(['COMPLETED', 'COMPLETED', 'COMPLETED', 'BLOCKED']);
        } else {
          status = faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED']);
        }
        
        const actionItemKey = `${orgKey}_${actionItemCounter++}`;
        actionItems[actionItemKey] = await prisma.actionItem.create({
          data: {
            description: faker.helpers.arrayElement([
              'Update strategic plan document',
              'Review competitive analysis',
              'Schedule customer feedback sessions',
              'Prepare report for next meeting',
              'Investigate performance issue',
              'Update team on project status',
              'Create presentation for leadership',
              'Analyze recent metric trends',
              'Document new process',
              'Research market opportunity',
              'Update dashboard with new metrics',
              'Follow up with key stakeholders',
              'Complete training module',
              'Review team workload distribution',
              'Prepare quarterly forecast'
            ]),
            status,
            priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
            dueDate,
            notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
            meetingId: meeting.id,
            assigneeId: assignee.id,
            createdAt: meeting.endTime,
            updatedAt: status === 'COMPLETED' ? addDays(meeting.endTime, faker.number.int({ min: 1, max: 10 })) : new Date(),
            completedAt: status === 'COMPLETED' ? addDays(meeting.endTime, faker.number.int({ min: 1, max: 10 })) : null
          }
        });
      }
    }
    
    // Create some standalone action items not tied to meetings
    for (let i = 0; i < 10; i++) {
      const assignee = faker.helpers.arrayElement(orgUsers);
      const createDate = addDays(new Date(), -faker.number.int({ min: 5, max: 30 }));
      const dueDate = addDays(createDate, faker.number.int({ min: 3, max: 21 }));
      const isPastDue = dueDate < new Date();
      
      // Determine status based on due date and randomness
      let status;
      if (isPastDue) {
        status = faker.helpers.arrayElement(['COMPLETED', 'COMPLETED', 'COMPLETED', 'BLOCKED']);
      } else {
        status = faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED']);
      }
      
      const actionItemKey = `${orgKey}_standalone_${i}`;
      actionItems[actionItemKey] = await prisma.actionItem.create({
        data: {
          description: faker.helpers.arrayElement([
            'Develop content strategy for Q3',
            'Review budget proposals',
            'Update product roadmap',
            'Interview candidates for open position',
            'Evaluate new technology solution',
            'Create training program for new hires',
            'Perform security assessment',
            'Analyze customer retention data',
            'Optimize database performance',
            'Update status report template',
            'Conduct team satisfaction survey',
            'Prepare annual review documentation',
            'Consolidate feedback from stakeholders',
            'Design new reporting dashboard',
            'Implement process improvement'
          ]),
          status,
          priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
          dueDate,
          notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          meetingId: null, // Not tied to a meeting
          assigneeId: assignee.id,
          createdAt: createDate,
          updatedAt: status === 'COMPLETED' ? addDays(createDate, faker.number.int({ min: 1, max: 10 })) : new Date(),
          completedAt: status === 'COMPLETED' ? addDays(createDate, faker.number.int({ min: 1, max: 10 })) : null
        }
      });
    }
  }
  
  return actionItems;
}

/**
 * Creates sample notifications for users
 * @param prisma Prisma client instance
 * @param organizations Created organizations
 * @param users Created users
 * @param meetings Created meetings
 * @param actionItems Created action items
 * @returns Object containing created notifications for reference
 */
async function createNotifications(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  users: Record<string, any>,
  meetings: Record<string, any>,
  actionItems: Record<string, any>
): Promise<Record<string, any>> {
  const notifications: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    // Get all users for this organization
    const orgUsers = Object.values(users).filter(
      (user: any) => user.organizationId === org.id && user.isActive
    );
    
    // Get upcoming meetings for this organization
    const upcomingMeetings = Object.values(meetings).filter(
      (meeting: any) => meeting.organizationId === org.id && 
                         meeting.status === 'SCHEDULED' &&
                         new Date(meeting.startTime) > new Date()
    );
    
    // Get pending action items
    const pendingActionItems = Object.values(actionItems).filter(
      (item: any) => item.status === 'PENDING' || item.status === 'IN_PROGRESS'
    );
    
    // Create meeting reminder notifications
    let notificationCounter = 0;
    
    for (const meeting of upcomingMeetings) {
      // Get participants
      const participants = await prisma.meetingParticipant.findMany({
        where: { meetingId: meeting.id },
        include: { user: true }
      });
      
      for (const participant of participants) {
        const notificationKey = `meeting_reminder_${orgKey}_${notificationCounter++}`;
        notifications[notificationKey] = await prisma.notification.create({
          data: {
            userId: participant.userId,
            type: 'MEETING_REMINDER',
            title: `Upcoming meeting: ${meeting.title}`,
            content: JSON.stringify({
              meetingId: meeting.id,
              meetingTitle: meeting.title,
              startTime: meeting.startTime,
              role: participant.role
            }),
            status: 'UNREAD',
            priority: 'MEDIUM',
            scheduledFor: new Date(new Date(meeting.startTime).getTime() - 15 * 60000), // 15 minutes before meeting
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Create notification delivery (for some channels)
        await prisma.notificationDelivery.createMany({
          data: [
            {
              notificationId: notifications[notificationKey].id,
              channel: 'IN_APP',
              status: 'SENT',
              sentAt: new Date(),
              error: null,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              notificationId: notifications[notificationKey].id,
              channel: 'EMAIL',
              status: 'SENT',
              sentAt: new Date(),
              error: null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        });
      }
    }
    
    // Create action item assigned notifications
    for (const item of pendingActionItems.slice(0, 15)) {
      if (!item.assigneeId) continue;
      
      const notificationKey = `action_item_${orgKey}_${notificationCounter++}`;
      notifications[notificationKey] = await prisma.notification.create({
        data: {
          userId: item.assigneeId,
          type: 'ACTION_ITEM_ASSIGNED',
          title: 'New action item assigned',
          content: JSON.stringify({
            actionItemId: item.id,
            description: item.description,
            dueDate: item.dueDate,
            priority: item.priority
          }),
          status: faker.helpers.arrayElement(['READ', 'UNREAD', 'UNREAD']),
          priority: item.priority === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          scheduledFor: null,
          createdAt: item.createdAt,
          updatedAt: new Date()
        }
      });
      
      // Create notification delivery
      await prisma.notificationDelivery.create({
        data: {
          notificationId: notifications[notificationKey].id,
          channel: 'IN_APP',
          status: 'SENT',
          sentAt: item.createdAt,
          error: null,
          createdAt: item.createdAt,
          updatedAt: new Date()
        }
      });
    }
    
    // Create metric alert notifications
    const metricAlertTitles = [
      'Revenue below target',
      'Customer satisfaction declining',
      'New customer acquisition exceeding goal',
      'Profit margin approaching critical threshold'
    ];
    
    for (let i = 0; i < 5; i++) {
      // Assign to leadership and CEO users
      const leadershipUsers = orgUsers.filter(
        (user: any) => user.role === UserRole.LEADERSHIP || user.role === UserRole.CEO
      );
      
      const user = faker.helpers.arrayElement(leadershipUsers);
      const notificationKey = `metric_alert_${orgKey}_${i}`;
      
      notifications[notificationKey] = await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'METRIC_ALERT',
          title: faker.helpers.arrayElement(metricAlertTitles),
          content: JSON.stringify({
            metricId: faker.string.uuid(), // Fake metric ID
            value: faker.number.float({ min: 10, max: 100, precision: 0.1 }),
            threshold: faker.number.float({ min: 10, max: 100, precision: 0.1 }),
            thresholdType: faker.helpers.arrayElement(['TARGET', 'WARNING', 'CRITICAL'])
          }),
          status: faker.helpers.arrayElement(['READ', 'UNREAD']),
          priority: faker.helpers.arrayElement(['MEDIUM', 'HIGH']),
          scheduledFor: null,
          createdAt: faker.date.recent({ days: 10 }),
          updatedAt: new Date()
        }
      });
      
      // Create notification delivery
      await prisma.notificationDelivery.createMany({
        data: [
          {
            notificationId: notifications[notificationKey].id,
            channel: 'IN_APP',
            status: 'SENT',
            sentAt: notifications[notificationKey].createdAt,
            error: null,
            createdAt: notifications[notificationKey].createdAt,
            updatedAt: new Date()
          },
          {
            notificationId: notifications[notificationKey].id,
            channel: 'EMAIL',
            status: 'SENT',
            sentAt: notifications[notificationKey].createdAt,
            error: null,
            createdAt: notifications[notificationKey].createdAt,
            updatedAt: new Date()
          }
        ]
      });
    }
    
    // Create system announcements
    const announcementTitles = [
      'Platform update scheduled',
      'New feature: Advanced metrics visualization',
      'Quarterly planning template updated',
      'Upcoming maintenance window',
      'New training resources available'
    ];
    
    for (let i = 0; i < 3; i++) {
      const notificationKey = `announcement_${orgKey}_${i}`;
      
      // Create for all org users
      for (const user of orgUsers) {
        notifications[`${notificationKey}_${user.id}`] = await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM_ANNOUNCEMENT',
            title: announcementTitles[i],
            content: JSON.stringify({
              message: faker.lorem.paragraph(),
              actionUrl: faker.datatype.boolean() ? faker.internet.url() : null
            }),
            status: faker.helpers.arrayElement(['READ', 'UNREAD', 'UNREAD']),
            priority: 'LOW',
            scheduledFor: null,
            createdAt: faker.date.recent({ days: 20 }),
            updatedAt: new Date()
          }
        });
        
        // Create notification delivery
        await prisma.notificationDelivery.create({
          data: {
            notificationId: notifications[`${notificationKey}_${user.id}`].id,
            channel: 'IN_APP',
            status: 'SENT',
            sentAt: notifications[`${notificationKey}_${user.id}`].createdAt,
            error: null,
            createdAt: notifications[`${notificationKey}_${user.id}`].createdAt,
            updatedAt: new Date()
          }
        });
      }
    }
  }
  
  return notifications;
}

/**
 * Generates a hashed password for test user accounts
 * @param plainPassword Plain text password
 * @returns Hashed password
 */
async function generatePassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Generates realistic historical metric values with trends
 * @param metricId Metric ID
 * @param userId User ID of the person recording the metric
 * @param metricType Type of metric (REVENUE, PERCENTAGE, COUNT)
 * @param startValue Starting value for the metric
 * @param monthsOfHistory Number of months of history to generate
 * @param volatility Volatility factor (0-1) to control how much values fluctuate
 * @returns Array of metric value objects ready for database insertion
 */
function generateFakeMetricValues(
  metricId: string,
  userId: string,
  metricType: string,
  startValue: number,
  monthsOfHistory: number,
  volatility: number
): Array<object> {
  const values = [];
  let currentValue = startValue;
  
  // Calculate start date based on months of history
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsOfHistory);
  
  // Set a general trend direction (positive for most metrics)
  const trendFactor = metricType === 'NEGATIVE' ? -0.05 : 0.05; // 5% monthly growth or decline
  
  // Generate a value for each month
  for (let i = 0; i < monthsOfHistory; i++) {
    // Apply trend and random noise
    const trend = currentValue * trendFactor;
    const noise = currentValue * volatility * (Math.random() * 2 - 1); // Random noise between -volatility and +volatility
    
    currentValue = Math.max(0, currentValue + trend + noise); // Ensure no negative values
    
    // For percentages, cap at 100%
    if (metricType === 'PERCENTAGE') {
      currentValue = Math.min(100, currentValue);
    }
    
    // Round appropriately based on metric type
    if (metricType === 'REVENUE') {
      currentValue = Math.round(currentValue / 1000) * 1000; // Round to nearest thousand
    } else if (metricType === 'PERCENTAGE') {
      currentValue = Math.round(currentValue * 10) / 10; // Round to 1 decimal place
    } else {
      currentValue = Math.round(currentValue); // Round to whole number
    }
    
    // Create value entry
    const entryDate = new Date(startDate);
    entryDate.setMonth(startDate.getMonth() + i);
    
    values.push({
      metricId,
      userId,
      value: currentValue,
      notes: `Value for ${entryDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      timestamp: entryDate,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  return values;
}

// Helper function to get the week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Helper function to add minutes to a date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// Execute the main function
main()
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });