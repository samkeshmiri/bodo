# Bodo - Full-Stack Fitness Fundraising Platform 🏃‍♂️💰

A modern full-stack application built with Next.js for fitness fundraising with escrow simulation. Connect your Strava activities to fundraising campaigns and earn money for causes you care about.

## 🛠️ Tech Stack

- **Frontend & Backend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Authentication**: Privy (planned)
- **Escrow**: In-memory simulation (no real blockchain for hackathon)

## 🏗️ Architecture

### Core Features

- ✅ **Full-Stack**: Single codebase for frontend and backend
- ✅ **Server-Side Rendering**: Better SEO and performance
- ✅ **API Routes**: RESTful API endpoints
- ✅ **Database Integration**: Prisma with PostgreSQL
- ✅ **Real-time Updates**: Server-side data fetching
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Type Safety**: End-to-end TypeScript

### Key Entities

1. **User** - Platform users with Privy integration
2. **Wallet** - User wallets (Privy or manual)
3. **Fundraise** - Fundraising campaigns with deadlines
4. **Pledge** - Staker commitments with per-km rates
5. **Activity** - Fitness activities from Strava
6. **Payout** - Escrow transactions and payouts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd bodo-app
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/bodo_db"
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   STRAVA_WEBHOOK_SECRET=your-strava-webhook-secret
   ```

3. **Set up database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with sample data
   npm run db:seed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
⚠️ **Note**: This is a hackathon prototype. In production, implement proper JWT authentication.

### Endpoints

#### Users

**POST** `/api/user`
Create a new user
```json
{
  "privyUserId": "privy_user_123",
  "stravaId": "strava_456",
  "status": "active"
}
```

**GET** `/api/user`
Get all users (with pagination)

**GET** `/api/user/:userId`
Get user details with related data

**PUT** `/api/user/:userId`
Update user details

#### Fundraises

**POST** `/api/fundraise`
Create a new fundraise
```json
{
  "userId": "user-uuid",
  "title": "Marathon for Cancer Research",
  "description": "Running a marathon to raise funds",
  "targetAmount": 1000,
  "deadline": "2024-12-31T23:59:59Z"
}
```

**GET** `/api/fundraise`
Get all fundraises (with filters and pagination)

**GET** `/api/fundraise/:fundraiseId`
Get fundraise details with pledges and progress

**PUT** `/api/fundraise/:fundraiseId`
Update fundraise details

**DELETE** `/api/fundraise/:fundraiseId`
Delete a fundraise (only if no pledges exist)

#### Pledges

**POST** `/api/pledge`
Create a new pledge
```json
{
  "stakerUserId": "user-uuid",
  "fundraiseId": "fundraise-uuid",
  "perKmRate": 2.5,
  "totalAmountPledged": 500
}
```

**GET** `/api/pledge`
Get all pledges (with filters and pagination)

**GET** `/api/pledge/:pledgeId`
Get pledge details with transaction history

**PUT** `/api/pledge/:pledgeId`
Update pledge details

#### Webhooks

**POST** `/api/webhook/strava`
Handle Strava activity events (real webhook)

**POST** `/api/webhook/strava/manual`
Manual activity creation for testing
```json
{
  "fundraiserUserId": "user-uuid",
  "distance": 5.2,
  "source": "Strava",
  "externalActivityId": "strava_activity_123"
}
```

**GET** `/api/webhook/strava/verify`
Strava webhook verification endpoint

## 💰 Escrow System

### How It Works

1. **Pledge Creation**: Stakers create pledges with per-km rates
2. **Activity Detection**: Strava activities trigger webhooks
3. **Payout Calculation**: `payout = min(distance * perKmRate, amountRemaining)`
4. **Transaction Simulation**: Mock blockchain transactions
5. **Balance Updates**: Automatic pledge amount tracking

### Payout Logic

```typescript
// For each active pledge when activity is detected:
const payoutAmount = Math.min(
  activity.distance * pledge.perKmRate,
  pledge.amountRemaining
);

// Update pledge amounts
pledge.amountRemaining -= payoutAmount;
pledge.amountPaidOut += payoutAmount;

// Mark as completed if fully paid out
if (pledge.amountRemaining <= 0) {
  pledge.status = 'completed';
}
```

## 🧪 Testing

### Manual Testing

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Visit the application**
   - Homepage: http://localhost:3000
   - Fundraises: http://localhost:3000/fundraises
   - API: http://localhost:3000/api/user

3. **Test API endpoints**
   ```bash
   # Create a user
   curl -X POST http://localhost:3000/api/user \
     -H "Content-Type: application/json" \
     -d '{"privyUserId": "test_user", "status": "active"}'

   # Create a fundraise
   curl -X POST http://localhost:3000/api/fundraise \
     -H "Content-Type: application/json" \
     -d '{"userId": "user-uuid", "title": "Test Fundraise", "targetAmount": 100, "deadline": "2024-12-31T23:59:59Z"}'

   # Test manual activity
   curl -X POST http://localhost:3000/api/webhook/strava/manual \
     -H "Content-Type: application/json" \
     -d '{"fundraiserUserId": "user-uuid", "distance": 10, "source": "Strava", "externalActivityId": "test_activity"}'
   ```

### Sample Data

The seed script creates:
- 3 users with wallets
- 2 fundraises
- 3 pledges with different rates
- 2 activities with processed payouts

## 🔧 Development

### Project Structure

```
bodo-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── user/
│   │   ├── fundraise/
│   │   ├── pledge/
│   │   └── webhook/
│   ├── fundraises/        # Fundraises page
│   ├── dashboard/         # Dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                   # Utilities
│   ├── prisma.ts          # Database client
│   ├── validations.ts     # Zod schemas
│   └── escrow.ts          # Escrow service
├── components/            # React components
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding
└── types/                 # TypeScript types
```

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with sample data
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `STRAVA_WEBHOOK_SECRET` | Strava webhook secret | Required |

## 🎨 Frontend Features

### Pages

- **Homepage** (`/`) - Landing page with features overview
- **Fundraises** (`/fundraises`) - Browse all fundraising campaigns
- **Dashboard** (`/dashboard`) - User dashboard (planned)
- **Fundraise Details** (`/fundraise/[id]`) - Individual campaign view (planned)

### Components

- **Responsive Design** - Mobile-first approach
- **Progress Bars** - Visual fundraising progress
- **Status Indicators** - Campaign and pledge status
- **Navigation** - Clean, intuitive navigation

## 🔒 Security Features

- **Input Validation** - Zod schema validation
- **SQL Injection Protection** - Prisma ORM
- **Error Handling** - Comprehensive error responses
- **Type Safety** - End-to-end TypeScript
- **Server-Side Rendering** - Secure data fetching

## 🚧 Limitations (Hackathon Prototype)

- ❌ No real blockchain integration
- ❌ No JWT authentication
- ❌ No email notifications
- ❌ No file uploads
- ❌ No real-time updates
- ❌ Limited error handling
- ❌ No audit logging

## 🔮 Future Enhancements

- [ ] Real blockchain integration (Ethereum/Polygon)
- [ ] JWT authentication with Privy
- [ ] Real-time notifications (WebSocket)
- [ ] Email notifications
- [ ] File uploads for campaign images
- [ ] Advanced analytics and reporting
- [ ] Multi-currency support
- [ ] Social features and sharing
- [ ] Mobile app integration
- [ ] Advanced escrow features
- [ ] User dashboard with charts
- [ ] Campaign creation wizard
- [ ] Pledge management interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions or issues:
- Create an issue in the repository
- Check the API documentation
- Review the sample data and tests

---

**Built with ❤️ for hackathon innovation using Next.js** 