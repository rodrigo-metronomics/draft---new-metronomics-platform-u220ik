import { PrismaClient } from '@prisma/client'; // v4.x
import { UserRole } from '../src/utils/constants/roles';
import { DEFAULT_MEETING_STAGES } from '../src/utils/constants/meetingStages';
import { METRIC_UNITS, METRIC_DEFAULT_COLORS } from '../src/utils/constants/metricTypes';

/**
 * Main function that orchestrates the database seeding process
 */
async function main(): Promise<void> {
  console.log('Starting database seed...');
  const prisma = new PrismaClient();
  
  try {
    await seed(prisma);
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Seeds the database with initial data for development and testing
 */
async function seed(prisma: PrismaClient): Promise<void> {
  // Clear existing data
  await clearDatabase(prisma);
  console.log('Cleared existing data');
  
  // Create organizations
  const organizations = await createOrganizations(prisma);
  console.log('Created organizations');
  
  // Create users
  const users = await createUsers(prisma, organizations);
  console.log('Created users');
  
  // Create teams
  const teams = await createTeams(prisma, organizations, users);
  console.log('Created teams');
  
  // Create goals
  const goals = await createGoals(prisma, organizations);
  console.log('Created strategic goals');
  
  // Create metrics
  const metrics = await createMetrics(prisma, organizations, teams, users);
  console.log('Created metrics');
  
  // Create KFFM
  const kffm = await createKFFM(prisma, organizations, users, metrics);
  console.log('Created KFFM structures');
  
  // Create meetings
  const meetings = await createMeetings(prisma, organizations, users);
  console.log('Created meetings');
  
  // Create action items
  const actionItems = await createActionItems(prisma, organizations, users, meetings);
  console.log('Created action items');
}

/**
 * Clears all existing data from the database tables
 */
async function clearDatabase(prisma: PrismaClient): Promise<void> {
  // Delete in order to respect foreign key constraints
  // Start with dependent tables and work upward
  await prisma.actionItem.deleteMany({});
  await prisma.meetingStage.deleteMany({});
  await prisma.meetingParticipant.deleteMany({});
  await prisma.meetingNote.deleteMany({});
  await prisma.meeting.deleteMany({});
  
  await prisma.kffmConnection.deleteMany({});
  await prisma.kffmNode.deleteMany({});
  await prisma.kffm.deleteMany({});
  
  await prisma.metricThreshold.deleteMany({});
  await prisma.metricValue.deleteMany({});
  await prisma.metric.deleteMany({});
  
  await prisma.milestone.deleteMany({});
  await prisma.goal.deleteMany({});
  
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
}

/**
 * Creates sample organizations with different settings
 */
async function createOrganizations(prisma: PrismaClient): Promise<Record<string, any>> {
  // Create sample organizations
  const acmeOrg = await prisma.organization.create({
    data: {
      name: 'Acme Inc.',
      settings: {
        theme: 'light',
        logoUrl: null,
        calendarIntegration: null
      }
    }
  });
  
  const techCorp = await prisma.organization.create({
    data: {
      name: 'TechCorp',
      settings: {
        theme: 'dark',
        logoUrl: null,
        calendarIntegration: 'google'
      }
    }
  });
  
  const globalServices = await prisma.organization.create({
    data: {
      name: 'Global Services',
      settings: {
        theme: 'light',
        logoUrl: 'https://example.com/logo.png',
        calendarIntegration: 'microsoft'
      }
    }
  });
  
  return {
    acmeOrg,
    techCorp,
    globalServices
  };
}

/**
 * Creates sample users with different roles and authentication methods
 */
async function createUsers(
  prisma: PrismaClient,
  organizations: Record<string, any>
): Promise<Record<string, any>> {
  const users: Record<string, any> = {};
  
  // Create a coach user with access to multiple organizations
  users.coach = await prisma.user.create({
    data: {
      email: 'coach@example.com',
      firstName: 'Sarah',
      lastName: 'Coach',
      name: 'Sarah Coach',
      role: UserRole.COACH,
      status: 'ACTIVE',
      authId: 'auth0|coach',
      authProvider: 'EMAIL_PASSWORD',
      photoURL: null,
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
      lastLoginAt: new Date()
    }
  });
  
  // Create users for each organization
  for (const [orgKey, org] of Object.entries(organizations)) {
    const orgName = org.name.replace(/\s+/g, '').toLowerCase();
    
    // CEO
    users[`${orgName}CEO`] = await prisma.user.create({
      data: {
        email: `ceo@${orgName}.com`,
        firstName: 'John',
        lastName: 'CEO',
        name: 'John CEO',
        role: UserRole.CEO,
        status: 'ACTIVE',
        organizationId: org.id,
        authId: `auth0|${orgName}ceo`,
        authProvider: 'EMAIL_PASSWORD',
        photoURL: null,
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
        lastLoginAt: new Date()
      }
    });
    
    // Leadership - Marketing
    users[`${orgName}Marketing`] = await prisma.user.create({
      data: {
        email: `marketing@${orgName}.com`,
        firstName: 'Lisa',
        lastName: 'Marketing',
        name: 'Lisa Marketing',
        role: UserRole.LEADERSHIP,
        status: 'ACTIVE',
        organizationId: org.id,
        authId: `auth0|${orgName}marketing`,
        authProvider: 'EMAIL_PASSWORD',
        photoURL: null,
        preferences: {
          theme: 'light',
          timezone: 'America/New_York',
          notificationPreferences: {
            email: true,
            inApp: true,
            push: false,
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
        lastLoginAt: new Date()
      }
    });
    
    // Leadership - Sales
    users[`${orgName}Sales`] = await prisma.user.create({
      data: {
        email: `sales@${orgName}.com`,
        firstName: 'Mike',
        lastName: 'Sales',
        name: 'Mike Sales',
        role: UserRole.LEADERSHIP,
        status: 'ACTIVE',
        organizationId: org.id,
        authId: `auth0|${orgName}sales`,
        authProvider: 'GOOGLE',
        photoURL: 'https://example.com/photos/mike.jpg',
        preferences: {
          theme: 'dark',
          timezone: 'America/Chicago',
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
        lastLoginAt: new Date()
      }
    });
    
    // Team Member 1
    users[`${orgName}TeamMember1`] = await prisma.user.create({
      data: {
        email: `team1@${orgName}.com`,
        firstName: 'Alex',
        lastName: 'Team',
        name: 'Alex Team',
        role: UserRole.TEAM_MEMBER,
        status: 'ACTIVE',
        organizationId: org.id,
        authId: `auth0|${orgName}team1`,
        authProvider: 'EMAIL_PASSWORD',
        photoURL: null,
        preferences: {
          theme: 'light',
          timezone: 'America/Los_Angeles',
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
        isActive: true,
        lastLoginAt: new Date()
      }
    });
    
    // Team Member 2
    users[`${orgName}TeamMember2`] = await prisma.user.create({
      data: {
        email: `team2@${orgName}.com`,
        firstName: 'Jamie',
        lastName: 'Developer',
        name: 'Jamie Developer',
        role: UserRole.TEAM_MEMBER,
        status: 'ACTIVE',
        organizationId: org.id,
        authId: `auth0|${orgName}team2`,
        authProvider: 'MICROSOFT',
        photoURL: 'https://example.com/photos/jamie.jpg',
        preferences: {
          theme: 'dark',
          timezone: 'Europe/London',
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
        lastLoginAt: new Date()
      }
    });
    
    // Viewer
    users[`${orgName}Viewer`] = await prisma.user.create({
      data: {
        email: `viewer@${orgName}.com`,
        firstName: 'Pat',
        lastName: 'Viewer',
        name: 'Pat Viewer',
        role: UserRole.VIEWER,
        status: 'ACTIVE',
        organizationId: org.id,
        authId: `auth0|${orgName}viewer`,
        authProvider: 'EMAIL_PASSWORD',
        photoURL: null,
        preferences: {
          theme: 'light',
          timezone: 'America/New_York',
          notificationPreferences: {
            email: true,
            inApp: true,
            push: false,
            meetingReminders: false,
            actionItems: false,
            metricAlerts: false,
            teamUpdates: false,
            digestFrequency: 'weekly'
          },
          dashboardLayout: {},
          customFields: {}
        },
        isActive: true,
        lastLoginAt: new Date()
      }
    });
  }
  
  return users;
}

/**
 * Creates sample teams and assigns users as team members
 */
async function createTeams(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  users: Record<string, any>
): Promise<Record<string, any>> {
  const teams: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    const orgName = org.name.replace(/\s+/g, '').toLowerCase();
    
    // Create Marketing team
    teams[`${orgName}Marketing`] = await prisma.team.create({
      data: {
        name: 'Marketing',
        description: 'Responsible for brand, marketing campaigns, and customer acquisition',
        organizationId: org.id
      }
    });
    
    // Add team members to Marketing
    await prisma.teamMember.create({
      data: {
        teamId: teams[`${orgName}Marketing`].id,
        userId: users[`${orgName}Marketing`].id,
        role: 'LEAD'
      }
    });
    
    await prisma.teamMember.create({
      data: {
        teamId: teams[`${orgName}Marketing`].id,
        userId: users[`${orgName}TeamMember1`].id,
        role: 'MEMBER'
      }
    });
    
    // Create Sales team
    teams[`${orgName}Sales`] = await prisma.team.create({
      data: {
        name: 'Sales',
        description: 'Responsible for revenue generation and customer relationships',
        organizationId: org.id
      }
    });
    
    // Add team members to Sales
    await prisma.teamMember.create({
      data: {
        teamId: teams[`${orgName}Sales`].id,
        userId: users[`${orgName}Sales`].id,
        role: 'LEAD'
      }
    });
    
    await prisma.teamMember.create({
      data: {
        teamId: teams[`${orgName}Sales`].id,
        userId: users[`${orgName}TeamMember2`].id,
        role: 'MEMBER'
      }
    });
    
    // Create Product team
    teams[`${orgName}Product`] = await prisma.team.create({
      data: {
        name: 'Product',
        description: 'Responsible for product strategy and development',
        organizationId: org.id
      }
    });
    
    // Add CEO as Product lead (for demo purposes)
    await prisma.teamMember.create({
      data: {
        teamId: teams[`${orgName}Product`].id,
        userId: users[`${orgName}CEO`].id,
        role: 'LEAD'
      }
    });
  }
  
  return teams;
}

/**
 * Creates sample strategic goals and milestones
 */
async function createGoals(
  prisma: PrismaClient,
  organizations: Record<string, any>
): Promise<Record<string, any>> {
  const goals: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    const orgName = org.name.replace(/\s+/g, '').toLowerCase();
    
    // Create BHAG (Big Hairy Audacious Goal)
    goals[`${orgName}BHAG`] = await prisma.goal.create({
      data: {
        type: 'BHAG',
        title: 'Become the industry leader with 30% market share',
        description: 'Transform the industry through innovation and exceptional customer experience to become the dominant player with 30% market share by 2030.',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2030-12-31'),
        status: 'ACTIVE',
        organizationId: org.id
      }
    });
    
    // Create milestones for BHAG
    await prisma.milestone.create({
      data: {
        goalId: goals[`${orgName}BHAG`].id,
        title: 'Reach 10% market share',
        description: 'Expand customer base and increase market presence',
        dueDate: new Date('2025-12-31'),
        status: 'PENDING'
      }
    });
    
    await prisma.milestone.create({
      data: {
        goalId: goals[`${orgName}BHAG`].id,
        title: 'Reach 20% market share',
        description: 'Solidify position as a top 3 player in the market',
        dueDate: new Date('2028-12-31'),
        status: 'PENDING'
      }
    });
    
    // Create 3HAG (3-Year Highly Achievable Goal)
    goals[`${orgName}3HAG`] = await prisma.goal.create({
      data: {
        type: '3HAG',
        title: '$50M annual revenue with 20% EBITDA',
        description: 'Achieve $50 million in annual revenue with a 20% EBITDA margin through product expansion and operational excellence.',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2025-12-31'),
        status: 'ACTIVE',
        organizationId: org.id
      }
    });
    
    // Create milestones for 3HAG
    await prisma.milestone.create({
      data: {
        goalId: goals[`${orgName}3HAG`].id,
        title: '$20M annual revenue with 12% EBITDA',
        description: 'Focus on customer acquisition and product-market fit',
        dueDate: new Date('2023-12-31'),
        status: 'IN_PROGRESS'
      }
    });
    
    await prisma.milestone.create({
      data: {
        goalId: goals[`${orgName}3HAG`].id,
        title: '$35M annual revenue with 15% EBITDA',
        description: 'Expand product line and improve operational efficiency',
        dueDate: new Date('2024-12-31'),
        status: 'PENDING'
      }
    });
    
    // Create 1HAG (1-Year Highly Achievable Goal)
    goals[`${orgName}1HAG`] = await prisma.goal.create({
      data: {
        type: '1HAG',
        title: 'Launch 3 new products and expand to 2 new markets',
        description: 'Accelerate growth by launching 3 new products and expanding to 2 new geographic markets this year.',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: 'ACTIVE',
        organizationId: org.id
      }
    });
    
    // Create milestones for 1HAG
    await prisma.milestone.create({
      data: {
        goalId: goals[`${orgName}1HAG`].id,
        title: 'Launch first new product',
        description: 'Complete development and marketing for first product launch',
        dueDate: new Date('2023-04-30'),
        status: 'COMPLETED'
      }
    });
    
    await prisma.milestone.create({
      data: {
        goalId: goals[`${orgName}1HAG`].id,
        title: 'Expand to first new market',
        description: 'Complete market analysis and establish local presence',
        dueDate: new Date('2023-06-30'),
        status: 'IN_PROGRESS'
      }
    });
    
    await prisma.milestone.create({
      data: {
        goalId: goals[`${orgName}1HAG`].id,
        title: 'Launch second and third products',
        description: 'Complete development and launch remaining products',
        dueDate: new Date('2023-09-30'),
        status: 'PENDING'
      }
    });
    
    // Create quarterly goal
    goals[`${orgName}Quarterly`] = await prisma.goal.create({
      data: {
        type: 'QUARTERLY',
        title: 'Improve customer retention by 15%',
        description: 'Implement customer success program and product improvements to reduce churn and increase retention by 15% this quarter.',
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-06-30'),
        status: 'ACTIVE',
        organizationId: org.id
      }
    });
    
    // Create milestones for quarterly goal
    await prisma.milestone.create({
      data: {
        goalId: goals[`${orgName}Quarterly`].id,
        title: 'Launch customer success program',
        description: 'Implement proactive outreach and support for at-risk customers',
        dueDate: new Date('2023-04-30'),
        status: 'COMPLETED'
      }
    });
    
    await prisma.milestone.create({
      data: {
        goalId: goals[`${orgName}Quarterly`].id,
        title: 'Release product improvements',
        description: 'Implement top 5 most requested features',
        dueDate: new Date('2023-05-31'),
        status: 'IN_PROGRESS'
      }
    });
  }
  
  return goals;
}

/**
 * Creates sample metrics, metric values, and thresholds
 */
async function createMetrics(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  teams: Record<string, any>,
  users: Record<string, any>
): Promise<Record<string, any>> {
  const metrics: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    const orgName = org.name.replace(/\s+/g, '').toLowerCase();
    
    // Create revenue metric
    metrics[`${orgName}Revenue`] = await prisma.metric.create({
      data: {
        name: 'Revenue',
        description: 'Total monthly revenue across all product lines',
        unit: METRIC_UNITS.CURRENCY_USD,
        comparisonType: 'YEAR_OVER_YEAR',
        calculationMethod: 'SUM',
        organizationId: org.id,
        teamId: teams[`${orgName}Sales`].id
      }
    });
    
    // Create metric thresholds for revenue
    await prisma.metricThreshold.create({
      data: {
        metricId: metrics[`${orgName}Revenue`].id,
        thresholdType: 'TARGET',
        value: 1000000, // $1M
        color: METRIC_DEFAULT_COLORS.TARGET
      }
    });
    
    await prisma.metricThreshold.create({
      data: {
        metricId: metrics[`${orgName}Revenue`].id,
        thresholdType: 'WARNING',
        value: 800000, // $800K
        color: METRIC_DEFAULT_COLORS.WARNING
      }
    });
    
    await prisma.metricThreshold.create({
      data: {
        metricId: metrics[`${orgName}Revenue`].id,
        thresholdType: 'CRITICAL',
        value: 650000, // $650K
        color: METRIC_DEFAULT_COLORS.CRITICAL
      }
    });
    
    // Create historical metric values for revenue
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      date.setDate(1); // First day of month
      
      // Generate some realistic but variable revenue numbers
      const baseValue = 800000;
      const variance = Math.random() * 300000 - 100000;
      const seasonality = Math.sin(i / 12 * 2 * Math.PI) * 100000;
      const value = Math.max(500000, baseValue + variance + seasonality);
      
      await prisma.metricValue.create({
        data: {
          metricId: metrics[`${orgName}Revenue`].id,
          value: value,
          timestamp: date,
          userId: users[`${orgName}Sales`].id,
          note: i === 0 ? 'Latest revenue figures' : null
        }
      });
    }
    
    // Create customer acquisition metric
    metrics[`${orgName}CustomerAcquisition`] = await prisma.metric.create({
      data: {
        name: 'New Customers',
        description: 'Number of new customers acquired per month',
        unit: METRIC_UNITS.COUNT,
        comparisonType: 'MONTH_OVER_MONTH',
        calculationMethod: 'COUNT',
        organizationId: org.id,
        teamId: teams[`${orgName}Marketing`].id
      }
    });
    
    // Create metric thresholds for customer acquisition
    await prisma.metricThreshold.create({
      data: {
        metricId: metrics[`${orgName}CustomerAcquisition`].id,
        thresholdType: 'TARGET',
        value: 100,
        color: METRIC_DEFAULT_COLORS.TARGET
      }
    });
    
    await prisma.metricThreshold.create({
      data: {
        metricId: metrics[`${orgName}CustomerAcquisition`].id,
        thresholdType: 'WARNING',
        value: 75,
        color: METRIC_DEFAULT_COLORS.WARNING
      }
    });
    
    await prisma.metricThreshold.create({
      data: {
        metricId: metrics[`${orgName}CustomerAcquisition`].id,
        thresholdType: 'CRITICAL',
        value: 50,
        color: METRIC_DEFAULT_COLORS.CRITICAL
      }
    });
    
    // Create historical metric values for customer acquisition
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      date.setDate(1); // First day of month
      
      // Generate some realistic customer acquisition numbers
      const baseValue = 80;
      const variance = Math.random() * 40 - 10;
      const seasonality = Math.sin(i / 12 * 2 * Math.PI) * 15;
      const value = Math.max(40, Math.round(baseValue + variance + seasonality));
      
      await prisma.metricValue.create({
        data: {
          metricId: metrics[`${orgName}CustomerAcquisition`].id,
          value: value,
          timestamp: date,
          userId: users[`${orgName}Marketing`].id,
          note: i === 0 ? 'Marketing campaign results' : null
        }
      });
    }
    
    // Create customer retention rate metric
    metrics[`${orgName}RetentionRate`] = await prisma.metric.create({
      data: {
        name: 'Retention Rate',
        description: 'Percentage of customers retained month over month',
        unit: METRIC_UNITS.PERCENTAGE,
        comparisonType: 'MONTH_OVER_MONTH',
        calculationMethod: 'AVERAGE',
        organizationId: org.id,
        teamId: teams[`${orgName}Product`].id
      }
    });
    
    // Create metric thresholds for retention rate
    await prisma.metricThreshold.create({
      data: {
        metricId: metrics[`${orgName}RetentionRate`].id,
        thresholdType: 'TARGET',
        value: 90, // 90%
        color: METRIC_DEFAULT_COLORS.TARGET
      }
    });
    
    await prisma.metricThreshold.create({
      data: {
        metricId: metrics[`${orgName}RetentionRate`].id,
        thresholdType: 'WARNING',
        value: 85, // 85%
        color: METRIC_DEFAULT_COLORS.WARNING
      }
    });
    
    await prisma.metricThreshold.create({
      data: {
        metricId: metrics[`${orgName}RetentionRate`].id,
        thresholdType: 'CRITICAL',
        value: 80, // 80%
        color: METRIC_DEFAULT_COLORS.CRITICAL
      }
    });
    
    // Create historical metric values for retention rate
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      date.setDate(1); // First day of month
      
      // Generate some realistic retention rate numbers
      const baseValue = 88;
      const variance = Math.random() * 5 - 2;
      const value = Math.min(98, Math.max(75, baseValue + variance));
      
      await prisma.metricValue.create({
        data: {
          metricId: metrics[`${orgName}RetentionRate`].id,
          value: value,
          timestamp: date,
          userId: users[`${orgName}CEO`].id,
          note: i === 0 ? 'Improved after product update' : null
        }
      });
    }
  }
  
  return metrics;
}

/**
 * Creates sample Key Function Flow Maps with nodes and connections
 */
async function createKFFM(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  users: Record<string, any>,
  metrics: Record<string, any>
): Promise<Record<string, any>> {
  const kffmStructures: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    const orgName = org.name.replace(/\s+/g, '').toLowerCase();
    
    // Create a KFFM structure
    kffmStructures[orgName] = await prisma.kffm.create({
      data: {
        title: 'Core Business Functions',
        version: '1.0',
        status: 'ACTIVE',
        organizationId: org.id
      }
    });
    
    // Create nodes for the KFFM
    const productNode = await prisma.kffmNode.create({
      data: {
        kffmId: kffmStructures[orgName].id,
        title: 'Product',
        description: 'Product development and management',
        ownerId: users[`${orgName}CEO`].id,
        positionX: 100,
        positionY: 100
      }
    });
    
    const marketingNode = await prisma.kffmNode.create({
      data: {
        kffmId: kffmStructures[orgName].id,
        title: 'Marketing',
        description: 'Customer acquisition and brand management',
        ownerId: users[`${orgName}Marketing`].id,
        positionX: 300,
        positionY: 100
      }
    });
    
    const salesNode = await prisma.kffmNode.create({
      data: {
        kffmId: kffmStructures[orgName].id,
        title: 'Sales',
        description: 'Revenue generation and customer relationships',
        ownerId: users[`${orgName}Sales`].id,
        positionX: 500,
        positionY: 100
      }
    });
    
    const customerSuccessNode = await prisma.kffmNode.create({
      data: {
        kffmId: kffmStructures[orgName].id,
        title: 'Customer Success',
        description: 'Customer support and retention',
        ownerId: users[`${orgName}CEO`].id,
        positionX: 500,
        positionY: 300
      }
    });
    
    // Create connections between nodes
    await prisma.kffmConnection.create({
      data: {
        kffmId: kffmStructures[orgName].id,
        sourceNodeId: productNode.id,
        targetNodeId: marketingNode.id,
        label: 'Provides product information',
        type: 'STANDARD'
      }
    });
    
    await prisma.kffmConnection.create({
      data: {
        kffmId: kffmStructures[orgName].id,
        sourceNodeId: marketingNode.id,
        targetNodeId: salesNode.id,
        label: 'Provides leads',
        type: 'STANDARD'
      }
    });
    
    await prisma.kffmConnection.create({
      data: {
        kffmId: kffmStructures[orgName].id,
        sourceNodeId: productNode.id,
        targetNodeId: salesNode.id,
        label: 'Provides features and roadmap',
        type: 'STANDARD'
      }
    });
    
    await prisma.kffmConnection.create({
      data: {
        kffmId: kffmStructures[orgName].id,
        sourceNodeId: salesNode.id,
        targetNodeId: customerSuccessNode.id,
        label: 'Transfers new customers',
        type: 'STANDARD'
      }
    });
    
    await prisma.kffmConnection.create({
      data: {
        kffmId: kffmStructures[orgName].id,
        sourceNodeId: customerSuccessNode.id,
        targetNodeId: productNode.id,
        label: 'Provides feedback',
        type: 'FEEDBACK'
      }
    });
  }
  
  return kffmStructures;
}

/**
 * Creates sample meetings with participants and stages
 */
async function createMeetings(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  users: Record<string, any>
): Promise<Record<string, any>> {
  const meetings: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    const orgName = org.name.replace(/\s+/g, '').toLowerCase();
    
    // Create a completed daily meeting
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(9, 0, 0, 0);
    
    meetings[`${orgName}CompletedDaily`] = await prisma.meeting.create({
      data: {
        title: 'Daily Huddle',
        description: 'Quick team sync to discuss priorities and blockers',
        meetingType: 'DAILY',
        status: 'COMPLETED',
        startTime: new Date(yesterday),
        endTime: new Date(new Date(yesterday).setMinutes(yesterday.getMinutes() + 15)),
        currentStage: null,
        organizationId: org.id,
        createdById: users[`${orgName}CEO`].id,
        location: 'Virtual',
        virtualMeetingUrl: 'https://meet.example.com/daily',
        completedAt: new Date(new Date(yesterday).setMinutes(yesterday.getMinutes() + 15))
      }
    });
    
    // Add participants to the completed daily meeting
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}CompletedDaily`].id,
        userId: users[`${orgName}CEO`].id,
        role: 'MODERATOR',
        attendanceStatus: 'ACCEPTED',
        joinedAt: new Date(yesterday),
        leftAt: new Date(new Date(yesterday).setMinutes(yesterday.getMinutes() + 15))
      }
    });
    
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}CompletedDaily`].id,
        userId: users[`${orgName}Marketing`].id,
        role: 'PARTICIPANT',
        attendanceStatus: 'ACCEPTED',
        joinedAt: new Date(yesterday),
        leftAt: new Date(new Date(yesterday).setMinutes(yesterday.getMinutes() + 15))
      }
    });
    
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}CompletedDaily`].id,
        userId: users[`${orgName}Sales`].id,
        role: 'PARTICIPANT',
        attendanceStatus: 'ACCEPTED',
        joinedAt: new Date(yesterday),
        leftAt: new Date(new Date(yesterday).setMinutes(yesterday.getMinutes() + 15))
      }
    });
    
    // Create meeting stages for the completed daily meeting using DEFAULT_MEETING_STAGES
    const dailyStages = DEFAULT_MEETING_STAGES.DAILY;
    
    for (const stageConfig of dailyStages) {
      if (stageConfig.stageType === 'SETUP') continue; // Skip setup stage for completed meeting
      
      let content = '';
      switch (stageConfig.stageType) {
        case 'GOOD_NEWS':
          content = 'Marketing: New campaign launched successfully\nSales: Closed 3 new deals\nCEO: Product development ahead of schedule';
          break;
        case 'PREVIOUS_ACTIONS':
          content = 'Completed: Update website with new messaging\nCompleted: Prepare sales forecast\nIn Progress: Finalize Q2 marketing budget';
          break;
        case 'PRIORITIES':
          content = 'Marketing: Finalize Q2 plan\nSales: Follow up with key prospects\nCEO: Review product roadmap';
          break;
        case 'BLOCKERS':
          content = 'Marketing: Need approval for additional budget\nSales: CRM issues affecting productivity';
          break;
        case 'NEW_ACTIONS':
          content = 'CEO: Review and approve marketing budget\nSales: Document CRM issues for IT team\nMarketing: Prepare campaign report';
          break;
        case 'SUMMARY':
          content = 'Productive meeting. All team members clear on priorities. Marketing budget approval needed by Friday.';
          break;
        default:
          content = '';
      }
      
      const stageStart = new Date(yesterday);
      stageStart.setMinutes(stageStart.getMinutes() + (stageConfig.sequence * 2));
      
      const stageEnd = new Date(stageStart);
      stageEnd.setMinutes(stageEnd.getMinutes() + 2);
      
      await prisma.meetingStage.create({
        data: {
          meetingId: meetings[`${orgName}CompletedDaily`].id,
          stageType: stageConfig.stageType,
          content: content,
          sequence: stageConfig.sequence,
          startedAt: stageStart,
          completedAt: stageEnd
        }
      });
    }
    
    // Create an upcoming daily meeting
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    meetings[`${orgName}UpcomingDaily`] = await prisma.meeting.create({
      data: {
        title: 'Daily Huddle',
        description: 'Quick team sync to discuss priorities and blockers',
        meetingType: 'DAILY',
        status: 'SCHEDULED',
        startTime: new Date(tomorrow),
        endTime: new Date(new Date(tomorrow).setMinutes(tomorrow.getMinutes() + 15)),
        currentStage: null,
        organizationId: org.id,
        createdById: users[`${orgName}CEO`].id,
        location: 'Virtual',
        virtualMeetingUrl: 'https://meet.example.com/daily'
      }
    });
    
    // Add participants to the upcoming daily meeting
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}UpcomingDaily`].id,
        userId: users[`${orgName}CEO`].id,
        role: 'MODERATOR',
        attendanceStatus: 'ACCEPTED'
      }
    });
    
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}UpcomingDaily`].id,
        userId: users[`${orgName}Marketing`].id,
        role: 'PARTICIPANT',
        attendanceStatus: 'ACCEPTED'
      }
    });
    
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}UpcomingDaily`].id,
        userId: users[`${orgName}Sales`].id,
        role: 'PARTICIPANT',
        attendanceStatus: 'ACCEPTED'
      }
    });
    
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}UpcomingDaily`].id,
        userId: users[`${orgName}TeamMember1`].id,
        role: 'PARTICIPANT',
        attendanceStatus: 'ACCEPTED'
      }
    });
    
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}UpcomingDaily`].id,
        userId: users[`${orgName}TeamMember2`].id,
        role: 'PARTICIPANT',
        attendanceStatus: 'TENTATIVE'
      }
    });
    
    // Create a weekly meeting
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);
    
    meetings[`${orgName}WeeklyMeeting`] = await prisma.meeting.create({
      data: {
        title: 'Weekly Review',
        description: 'Weekly team review of metrics, priorities, and progress',
        meetingType: 'WEEKLY',
        status: 'SCHEDULED',
        startTime: new Date(nextWeek),
        endTime: new Date(new Date(nextWeek).setMinutes(nextWeek.getMinutes() + 60)),
        currentStage: null,
        organizationId: org.id,
        createdById: users[`${orgName}CEO`].id,
        location: 'Conference Room A',
        virtualMeetingUrl: 'https://meet.example.com/weekly'
      }
    });
    
    // Add participants to the weekly meeting
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}WeeklyMeeting`].id,
        userId: users[`${orgName}CEO`].id,
        role: 'MODERATOR',
        attendanceStatus: 'ACCEPTED'
      }
    });
    
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}WeeklyMeeting`].id,
        userId: users[`${orgName}Marketing`].id,
        role: 'PARTICIPANT',
        attendanceStatus: 'ACCEPTED'
      }
    });
    
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}WeeklyMeeting`].id,
        userId: users[`${orgName}Sales`].id,
        role: 'PARTICIPANT',
        attendanceStatus: 'ACCEPTED'
      }
    });
    
    // Create a quarterly planning meeting
    const nextQuarter = new Date();
    nextQuarter.setMonth(nextQuarter.getMonth() + 3);
    nextQuarter.setDate(1);
    nextQuarter.setHours(9, 0, 0, 0);
    
    meetings[`${orgName}QuarterlyPlanning`] = await prisma.meeting.create({
      data: {
        title: 'Quarterly Planning Session',
        description: 'Strategic planning and goal setting for the upcoming quarter',
        meetingType: 'QUARTERLY',
        status: 'SCHEDULED',
        startTime: new Date(nextQuarter),
        endTime: new Date(new Date(nextQuarter).setHours(nextQuarter.getHours() + 8)),
        currentStage: null,
        organizationId: org.id,
        createdById: users[`${orgName}CEO`].id,
        location: 'Main Conference Room',
        virtualMeetingUrl: 'https://meet.example.com/quarterly'
      }
    });
    
    // Add participants to the quarterly planning meeting
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}QuarterlyPlanning`].id,
        userId: users[`${orgName}CEO`].id,
        role: 'MODERATOR',
        attendanceStatus: 'ACCEPTED'
      }
    });
    
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}QuarterlyPlanning`].id,
        userId: users[`${orgName}Marketing`].id,
        role: 'PARTICIPANT',
        attendanceStatus: 'ACCEPTED'
      }
    });
    
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}QuarterlyPlanning`].id,
        userId: users[`${orgName}Sales`].id,
        role: 'PARTICIPANT',
        attendanceStatus: 'ACCEPTED'
      }
    });
    
    // Coach as observer
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meetings[`${orgName}QuarterlyPlanning`].id,
        userId: users.coach.id,
        role: 'OBSERVER',
        attendanceStatus: 'ACCEPTED'
      }
    });
  }
  
  return meetings;
}

/**
 * Creates sample action items assigned to users
 */
async function createActionItems(
  prisma: PrismaClient,
  organizations: Record<string, any>,
  users: Record<string, any>,
  meetings: Record<string, any>
): Promise<Record<string, any>> {
  const actionItems: Record<string, any> = {};
  
  for (const [orgKey, org] of Object.entries(organizations)) {
    const orgName = org.name.replace(/\s+/g, '').toLowerCase();
    let actionItemIndex = 1;
    
    // Create action items from completed daily meeting
    actionItems[`${orgName}ActionItem${actionItemIndex}`] = await prisma.actionItem.create({
      data: {
        description: 'Review and approve marketing budget',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: new Date(new Date().setDate(new Date().getDate() - 1)),
        completedAt: new Date(),
        assigneeId: users[`${orgName}CEO`].id,
        createdById: users[`${orgName}CEO`].id,
        meetingId: meetings[`${orgName}CompletedDaily`].id,
        organizationId: org.id
      }
    });
    actionItemIndex++;
    
    actionItems[`${orgName}ActionItem${actionItemIndex}`] = await prisma.actionItem.create({
      data: {
        description: 'Document CRM issues for IT team',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        assigneeId: users[`${orgName}Sales`].id,
        createdById: users[`${orgName}CEO`].id,
        meetingId: meetings[`${orgName}CompletedDaily`].id,
        organizationId: org.id
      }
    });
    actionItemIndex++;
    
    actionItems[`${orgName}ActionItem${actionItemIndex}`] = await prisma.actionItem.create({
      data: {
        description: 'Prepare campaign report',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
        assigneeId: users[`${orgName}Marketing`].id,
        createdById: users[`${orgName}CEO`].id,
        meetingId: meetings[`${orgName}CompletedDaily`].id,
        organizationId: org.id
      }
    });
    actionItemIndex++;
    
    // Create additional action items not tied to meetings
    actionItems[`${orgName}ActionItem${actionItemIndex}`] = await prisma.actionItem.create({
      data: {
        description: 'Finalize Q2 strategic roadmap',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
        assigneeId: users[`${orgName}CEO`].id,
        createdById: users[`${orgName}CEO`].id,
        organizationId: org.id
      }
    });
    actionItemIndex++;
    
    actionItems[`${orgName}ActionItem${actionItemIndex}`] = await prisma.actionItem.create({
      data: {
        description: 'Develop competitor analysis report',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        assigneeId: users[`${orgName}Marketing`].id,
        createdById: users[`${orgName}CEO`].id,
        organizationId: org.id
      }
    });
    actionItemIndex++;
    
    actionItems[`${orgName}ActionItem${actionItemIndex}`] = await prisma.actionItem.create({
      data: {
        description: 'Prepare sales forecast for next quarter',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
        assigneeId: users[`${orgName}Sales`].id,
        createdById: users[`${orgName}CEO`].id,
        organizationId: org.id
      }
    });
    actionItemIndex++;
    
    actionItems[`${orgName}ActionItem${actionItemIndex}`] = await prisma.actionItem.create({
      data: {
        description: 'Review customer feedback and identify improvement opportunities',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        assigneeId: users[`${orgName}TeamMember1`].id,
        createdById: users[`${orgName}Marketing`].id,
        organizationId: org.id
      }
    });
    actionItemIndex++;
    
    actionItems[`${orgName}ActionItem${actionItemIndex}`] = await prisma.actionItem.create({
      data: {
        description: 'Update product documentation with new features',
        status: 'PENDING',
        priority: 'LOW',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
        assigneeId: users[`${orgName}TeamMember2`].id,
        createdById: users[`${orgName}CEO`].id,
        organizationId: org.id
      }
    });
    actionItemIndex++;
    
    actionItems[`${orgName}ActionItem${actionItemIndex}`] = await prisma.actionItem.create({
      data: {
        description: 'Fix critical bug in reporting module',
        status: 'BLOCKED',
        priority: 'CRITICAL',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        assigneeId: users[`${orgName}TeamMember2`].id,
        createdById: users[`${orgName}CEO`].id,
        organizationId: org.id,
        blockedReason: 'Waiting for IT to provide access to production logs'
      }
    });
  }
  
  return actionItems;
}

// Start the seeding process
main().catch(e => {
  console.error(e);
  process.exit(1);
});