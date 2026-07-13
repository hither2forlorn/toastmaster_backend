import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from 'src/modules/user/entities/user.entity';
import { Club } from 'src/modules/club/entities/club.entity';
import { ClubMember } from 'src/modules/club/entities/club-member.entity';
import { Meeting } from 'src/modules/meeting/entities/meeting.entity';
import { Agenda } from 'src/modules/agenda/entities/agenda.entity';
import { AgendaReport, ReportType } from 'src/modules/agenda-report/entities/agenda-report.entity';
import { ClubRole } from 'src/modules/club/enum/club-role.enum';
import { ClubMeetingFrequency } from 'src/modules/club/enum/club-meeting-frequency.enum';
import { MEETING_STATUS } from 'src/modules/meeting/enum/meeting-status.enum';
import { MembershipStatus } from 'src/modules/club/enum/club-members.enum';

const FIRST_NAMES = [
  'Ram', 'Sita', 'Hari', 'Gita', 'Arjun', 'Maya', 'Bikram', 'Nisha',
  'Rajesh', 'Sunita', 'Deepak', 'Anita', 'Kiran', 'Sarita', 'Bishal',
  'Pooja', 'Aakash', 'Rina', 'Suresh', 'Laxmi', 'Bibek', 'Samikshya',
  'Rohit', 'Aasha', 'Manoj', 'Priya', 'Sandeep', 'Binita', 'Anil', 'Kamala',
];
const LAST_NAMES = [
  'Sharma', 'Thapa', 'Gurung', 'Tamang', 'Rai', 'Limbu', 'Shrestha',
  'Pradhan', 'Karki', 'Bista', 'Magar', 'Newar', 'Adhikari', 'Pokharel',
  'Khadka', 'Poudel', 'Basnet', 'Acharya', 'Dahal', 'Giri',
];
const CLUB_NAMES = [
  'Himalayan Speakers', 'Everest Orators', 'Pokhara Leaders',
  'Chitwan Communicators', 'Lumbini Toastmasters', 'Gorkhali Club',
  'Newari Narrators', 'Terai Talkers', 'Annapurna Achievers',
  'Bagmati Voices', 'Gandaki Guild', 'Karnali Club',
];
const VENUES = [
  'Community Hall', 'Hotel Summit', 'City Library', 'Rotary Hall',
  'Conference Center', 'Club House', 'Town Hall',
];
const THEMES = [
  'Leadership', 'Confidence', 'Storytelling', 'Innovation', 'Teamwork',
  'Courage', 'Creativity', 'Resilience', 'Vision', 'Integrity',
  'Excellence', 'Empathy', 'Motivation', 'Adaptability',
];
const ROLES = [
  'Toastmaster of the Evening', 'Speaker', 'Evaluator', 'Timer',
  'General Evaluator', 'Table Topics Master', 'Grammarian', 'Ah Counter',
  'Warmup Master', 'Ballot Counter', 'Toastmaster', 'Invocator',
];
const WORDS_OF_DAY = [
  'Resilience', 'Courage', 'Empathy', 'Vision', 'Integrity',
  'Innovation', 'Grit', 'Mindfulness', 'Synergy', 'Gratitude',
];
const GRAMMAR_NOTES = [
  'Overall excellent grammar usage by all speakers',
  'Good use of transitional phrases throughout the meeting',
  'Speakers used varied vocabulary effectively',
  'Minor article errors noted; otherwise strong delivery',
];
const FILLER_NOTES = [
  'Members should practice pausing instead of using filler words',
  'Filler word usage was moderate and improved through the meeting',
  'Encouraging progress on reducing "um" and "ah"',
  'Some speakers still rely on filler words under pressure',
];

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const fullName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

const tmCounterByClub = new Map<string, number>();
const nextToastmasterId = (clubCode: string): string => {
  const prefix = clubCode.split('-')[0].slice(0, 2).toUpperCase();
  const current = tmCounterByClub.get(clubCode) ?? 10000000;
  const next = current + 1;
  tmCounterByClub.set(clubCode, next);
  return `${prefix}-${next}`;
};

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  while (result.length < n && copy.length > 0) {
    result.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return result;
}

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Club)
    private clubRepository: Repository<Club>,
    @InjectRepository(ClubMember)
    private clubMemberRepository: Repository<ClubMember>,
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
    @InjectRepository(Agenda)
    private agendaRepository: Repository<Agenda>,
    @InjectRepository(AgendaReport)
    private agendaReportRepository: Repository<AgendaReport>,
  ) {}

  async seed() {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Seeding is only allowed in development environment!');
    }

    // Clear existing data in correct order (child tables first)
    console.log('🧹 Clearing existing data...');

    const existingReports = await this.agendaReportRepository.find();
    if (existingReports.length > 0) {
      await this.agendaReportRepository.remove(existingReports);
    }

    const existingAgendas = await this.agendaRepository.find();
    if (existingAgendas.length > 0) {
      await this.agendaRepository.remove(existingAgendas);
    }

    const existingMeetings = await this.meetingRepository.find();
    if (existingMeetings.length > 0) {
      await this.meetingRepository.remove(existingMeetings);
    }

    const existingMembers = await this.clubMemberRepository.find();
    if (existingMembers.length > 0) {
      await this.clubMemberRepository.remove(existingMembers);
    }

    const existingClubs = await this.clubRepository.find();
    if (existingClubs.length > 0) {
      await this.clubRepository.remove(existingClubs);
    }

    const existingUsers = await this.userRepository.find();
    if (existingUsers.length > 0) {
      await this.userRepository.remove(existingUsers);
    }

    console.log('🌱 Starting database seeding...');

    // 1. Create Users (original + generated)
    const userOne = this.userRepository.create({
      id: 'ff33b027-150f-4d12-a583-6e0ac79bbfcf',
      email: 'one@sk.com',
      password: 'password123',
      fullName: 'one andonly',
    });

    const userTwo = this.userRepository.create({
      id: '73ee9ae1-0ebd-4552-bc67-827b044192dc',
      email: 'two@sk.com',
      password: 'password123',
      fullName: 'two andonly',
    });

    const generatedUsers: User[] = [];
    for (let i = 0; i < 30; i++) {
      const name = fullName();
      generatedUsers.push(
        this.userRepository.create({
          id: randomUUID(),
          email: `user${i + 1}@toastmasters.test`,
          password: 'password123',
          fullName: name,
          introduction: `Dedicated toastmaster passionate about public speaking and leadership.`,
        }),
      );
    }

    const allUsers = [userOne, userTwo, ...generatedUsers];
    await this.userRepository.save(allUsers);
    console.log(`✅ Users created (${allUsers.length})`);

    // 2. Create Clubs (original + generated)
    const clubKathmandu = this.clubRepository.create({
      id: 'ad3e1e78-9f75-4c31-9d19-48616a04f886',
      name: 'Kathmandu Toastmasters Club',
      description: 'A premier public speaking and leadership club in Kathmandu',
      district: 'District 41',
      area: 'Area 1',
      division: 'Division A',
      ownerId: userOne.id,
      meetingFrequency: ClubMeetingFrequency.WEEKLY,
      clubCode: 'KTM-TM-001',
      charterDate: new Date('2018-05-12'),
      socialLinks: ['https://facebook.com/kathmandu-tm', 'https://kathmandutm.org'],
    });

    const clubPatan = this.clubRepository.create({
      id: '25ef84c6-7489-4b93-9c51-256156f4186c',
      name: 'Patan Advanced Speakers',
      description: 'Advanced toastmasters focusing on leadership and mentoring',
      district: 'District 41',
      area: 'Area 2',
      division: 'Division B',
      ownerId: userOne.id,
      meetingFrequency: ClubMeetingFrequency.BIWEEKLY,
      clubCode: 'PTN-ADV-002',
      charterDate: new Date('2019-09-01'),
      socialLinks: ['https://patanadvanced.org'],
    });

    const clubBhaktapur = this.clubRepository.create({
      id: '9188b854-970b-4185-840c-5fbf61288401',
      name: 'Bhaktapur Evening Club',
      description:
        'Evening sessions for working professionals to improve communication',
      district: 'District 41',
      area: 'Area 1',
      division: 'Division A',
      ownerId: userTwo.id,
      meetingFrequency: ClubMeetingFrequency.WEEKLY,
      clubCode: 'BKT-EVE-003',
      charterDate: new Date('2020-02-20'),
      socialLinks: ['https://bhaktapurtm.org', 'https://instagram.com/bkt-tm'],
    });

    const generatedClubs: Club[] = [];
    for (let i = 0; i < CLUB_NAMES.length; i++) {
      const owner = pick(allUsers);
      generatedClubs.push(
        this.clubRepository.create({
          id: randomUUID(),
          name: CLUB_NAMES[i],
          description: `A vibrant toastmasters club focused on ${pick(THEMES).toLowerCase()} and communication excellence`,
          district: 'District 41',
          area: `Area ${randInt(1, 6)}`,
          division: `Division ${pick(['A', 'B', 'C', 'D'])}`,
          ownerId: owner.id,
          meetingFrequency: pick([
            ClubMeetingFrequency.WEEKLY,
            ClubMeetingFrequency.BIWEEKLY,
            ClubMeetingFrequency.MONTHLY,
          ]),
          clubCode: `SEED-${String(i + 1).padStart(3, '0')}`,
          charterDate: new Date(2015 + randInt(0, 10), randInt(0, 11), randInt(1, 28)),
          socialLinks: pick([
            [`https://facebook.com/${CLUB_NAMES[i].replace(/\s+/g, '-').toLowerCase()}`],
            [`https://${CLUB_NAMES[i].replace(/\s+/g, '').toLowerCase()}.org`, `https://instagram.com/${CLUB_NAMES[i].replace(/\s+/g, '').toLowerCase()}`],
            null,
          ]),
        }),
      );
    }

    const allClubs = [clubKathmandu, clubPatan, clubBhaktapur, ...generatedClubs];
    await this.clubRepository.save(allClubs);
    console.log(`✅ Clubs created (${allClubs.length})`);

    // 3. Create Club Members (original + generated)
    const members = [
      // Kathmandu members
      {
        id: '11111111-1111-1111-1111-111111111111',
        userId: userOne.id,
        clubId: clubKathmandu.id,
        memberName: 'one andonly',
        memberEmail: 'one@sk.com',
        role: ClubRole.OWNER,
        status: MembershipStatus.ACTIVE,
        toastmasterId: nextToastmasterId(clubKathmandu.clubCode),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        userId: userTwo.id,
        clubId: clubKathmandu.id,
        memberName: 'two andonly',
        memberEmail: 'two@sk.com',
        role: ClubRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        toastmasterId: nextToastmasterId(clubKathmandu.clubCode),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        userId: null,
        clubId: clubKathmandu.id,
        memberName: 'Guest Speaker Ram',
        memberEmail: 'ram@guest.com',
        role: ClubRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        toastmasterId: nextToastmasterId(clubKathmandu.clubCode),
      },
      // Patan members
      {
        id: '44444444-4444-4444-4444-444444444444',
        userId: userOne.id,
        clubId: clubPatan.id,
        memberName: 'one andonly',
        memberEmail: 'one@sk.com',
        role: ClubRole.OWNER,
        status: MembershipStatus.ACTIVE,
        toastmasterId: nextToastmasterId(clubPatan.clubCode),
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        userId: null,
        clubId: clubPatan.id,
        memberName: 'Sita Sharma',
        memberEmail: 'sita@guest.com',
        role: ClubRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        toastmasterId: nextToastmasterId(clubPatan.clubCode),
      },
      // Bhaktapur members
      {
        id: '66666666-6666-6666-6666-666666666666',
        userId: userTwo.id,
        clubId: clubBhaktapur.id,
        memberName: 'two andonly',
        memberEmail: 'two@sk.com',
        role: ClubRole.OWNER,
        status: MembershipStatus.ACTIVE,
        toastmasterId: nextToastmasterId(clubBhaktapur.clubCode),
      },
      {
        id: '77777777-7777-7777-7777-777777777777',
        userId: userOne.id,
        clubId: clubBhaktapur.id,
        memberName: 'one andonly',
        memberEmail: 'one@sk.com',
        role: ClubRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        toastmasterId: nextToastmasterId(clubBhaktapur.clubCode),
      },
      {
        id: '88888888-8888-8888-8888-888888888888',
        userId: null,
        clubId: clubBhaktapur.id,
        memberName: 'Hari Prasad',
        memberEmail: 'hari@guest.com',
        role: ClubRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        toastmasterId: nextToastmasterId(clubBhaktapur.clubCode),
      },
    ];

    const membersByClub = new Map<string, any[]>();
    for (const club of allClubs) {
      membersByClub.set(club.id, []);
    }

    for (const club of allClubs) {
      const clubMembers: any[] = [];
      // Owner member (skip if one already exists for this club)
      const ownerUser = allUsers.find((u) => u.id === club.ownerId)!;
      const ownerExists = members.some(
        (m) => m.clubId === club.id && m.userId === ownerUser.id,
      );
      if (!ownerExists) {
        clubMembers.push({
          id: randomUUID(),
          userId: ownerUser.id,
          clubId: club.id,
          memberName: ownerUser.fullName,
          memberEmail: ownerUser.email,
          role: ClubRole.OWNER,
          status: MembershipStatus.ACTIVE,
          toastmasterId: nextToastmasterId(club.clubCode),
        });
      }

      // Generated guest members
      const guestCount = randInt(12, 22);
      for (let i = 0; i < guestCount; i++) {
        const name = fullName();
        const guest = {
          id: randomUUID(),
          userId: null,
          clubId: club.id,
          memberName: name,
          memberEmail: `member_${club.id.slice(0, 8)}_${i}@toastmasters.test`,
          toastmasterId: nextToastmasterId(club.clubCode),
          role: ClubRole.MEMBER,
          status: pick([
            MembershipStatus.ACTIVE,
            MembershipStatus.ACTIVE,
            MembershipStatus.ACTIVE,
            MembershipStatus.PENDING,
            MembershipStatus.REJECTED,
          ]),
        };
        clubMembers.push(guest);
      }
      membersByClub.set(club.id, clubMembers);
      members.push(...clubMembers);
    }

    await this.clubMemberRepository.save(members);
    console.log(`✅ Club members created (${members.length})`);

    // 4. Create Meetings (original + generated)
    const meetings = [
      {
        id: '00000001-1111-1111-1111-111111111111',
        meetingNo: 1,
        theme: 'New Beginnings',
        date: new Date('2026-01-20'),
        time: '18:00:00',
        venue: 'Kathmandu Community Hall',
        notes: 'First meeting of the year - welcome new members',
        status: MEETING_STATUS.SCHEDULED,
        clubId: clubKathmandu.id,
      },
      {
        id: '00000003-3333-3333-3333-333333333333',
        meetingNo: 3,
        theme: 'Year End Celebration',
        date: new Date('2025-12-15'),
        time: '18:00:00',
        venue: 'Kathmandu Community Hall',
        notes: 'Successfully completed year-end meeting',
        status: MEETING_STATUS.COMPLETED,
        clubId: clubKathmandu.id,
      },
      {
        id: '00000009-9999-9999-9999-999999999999',
        meetingNo: 4,
        theme: 'Innovation and Creativity',
        date: new Date('2025-11-20'),
        time: '18:00:00',
        venue: 'Kathmandu Community Hall',
        notes: 'Amazing speeches on creative thinking',
        status: MEETING_STATUS.COMPLETED,
        clubId: clubKathmandu.id,
      },
    ];

    const meetingNoByClub = new Map<string, number>();
    for (const club of allClubs) {
      meetingNoByClub.set(club.id, 0);
    }

    const completedMeetings: { meeting: any; clubId: string }[] = [];
    for (const club of allClubs) {
      const meetingCount = randInt(5, 9);
      for (let i = 0; i < meetingCount; i++) {
        const no = (meetingNoByClub.get(club.id) ?? 0) + 1;
        meetingNoByClub.set(club.id, no);
        const isCompleted = Math.random() < 0.7;
        const daysAgo = randInt(0, 400);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const meeting = {
          id: randomUUID(),
          meetingNo: no,
          theme: pick(THEMES),
          date,
          time: pick(['17:30:00', '18:00:00', '18:30:00', '19:00:00']),
          venue: pick(VENUES),
          notes: isCompleted
            ? 'Successfully conducted meeting with engaging sessions'
            : 'Upcoming meeting - preparations in progress',
          status: isCompleted ? MEETING_STATUS.COMPLETED : MEETING_STATUS.SCHEDULED,
          clubId: club.id,
        };
        meetings.push(meeting);
        if (isCompleted) {
          completedMeetings.push({ meeting, clubId: club.id });
        }
      }
    }

    await this.meetingRepository.save(meetings);
    console.log(`✅ Meetings created (${meetings.length})`);

    // 5. Create Agendas (original + generated)
    const agendas = [
      {
        id: 'a0000006-3333-3333-3333-333333333333',
        title: 'Opening and Introduction',
        roleName: 'Toastmaster of the Evening',
        duration: 5,
        sequence: 1,
        meetingId: '00000003-3333-3333-3333-333333333333',
        memberId: '11111111-1111-1111-1111-111111111111',
        memberName: 'one andonly',
        isGuest: false,
        notes: 'Great energy throughout',
      },
      {
        id: 'a0000007-3333-3333-3333-333333333333',
        title: 'Grammarian Report',
        roleName: 'Grammarian',
        duration: 3,
        sequence: 2,
        meetingId: '00000003-3333-3333-3333-333333333333',
        memberId: '22222222-2222-2222-2222-222222222222',
        memberName: 'two andonly',
        isGuest: false,
        notes: 'Word of the day: Resilience',
      },
      {
        id: 'a0000008-3333-3333-3333-333333333333',
        title: 'Ah Counter Report',
        roleName: 'Ah Counter',
        duration: 2,
        sequence: 3,
        meetingId: '00000003-3333-3333-3333-333333333333',
        memberId: '33333333-3333-3333-3333-333333333333',
        memberName: 'Guest Speaker Ram',
        isGuest: true,
        notes: 'Tracked filler words effectively',
      },
    ];

    const generatedAgendas: { agenda: any; clubId: string }[] = [];
    for (const { meeting, clubId } of completedMeetings) {
      const agendaCount = randInt(5, 9);
      const clubMembers = membersByClub.get(clubId) ?? [];
      for (let k = 0; k < agendaCount; k++) {
        const roleName = ROLES[k % ROLES.length];
        const member = pick(clubMembers);
        const agenda = {
          id: randomUUID(),
          title: `${roleName} Session`,
          roleName,
          duration: pick([2, 3, 5, 5, 7, 10]),
          sequence: k + 1,
          meetingId: meeting.id,
          memberId: member.id,
          memberName: member.memberName,
          isGuest: !member.userId,
          notes: `Performed the role of ${roleName} with ${pick(['great', 'good', 'excellent', 'satisfactory'])} results`,
        };
        agendas.push(agenda);
        generatedAgendas.push({ agenda, clubId });
      }
    }

    await this.agendaRepository.save(agendas);
    console.log(`✅ Agendas created (${agendas.length})`);

    // 6. Create Agenda Reports (original + generated)
    const reports = [
      {
        id: '10000001-0001-0001-0001-000000000001',
        agendaId: 'a0000007-3333-3333-3333-333333333333',
        reportType: ReportType.GRAMMARIAN,
        wordOfTheDay: 'Resilience',
        wordOfTheDayDefinition:
          'The capacity to withstand or to recover quickly from difficulties; toughness.',
        grammarNotes: 'Overall excellent grammar usage by all speakers',
        memberEvaluations: [
          {
            memberId: 'ff33b027-150f-4d12-a583-6e0ac79bbfcf',
            memberName: 'one andonly',
            wordUsageCount: 3,
            examples: [
              'showed great resilience in handling tough questions',
              'resilient mindset',
              'building resilience',
            ],
            grammarIssues: "Minor: used 'gonna' instead of 'going to' once",
          },
        ],
        overallNotes:
          'Excellent word usage throughout the meeting. Members incorporated the word naturally.',
      },
      {
        id: '20000002-0002-0002-0002-000000000002',
        agendaId: 'a0000008-3333-3333-3333-333333333333',
        reportType: ReportType.AH_COUNTER,
        fillerWordCounts: [
          {
            memberId: 'ff33b027-150f-4d12-a583-6e0ac79bbfcf',
            memberName: 'one andonly',
            ahs: 2,
            ums: 1,
            likes: 0,
            other: 1,
            notes: 'Very controlled speaking, minimal filler words',
          },
          {
            memberId: '73ee9ae1-0ebd-4552-bc67-827b044192dc',
            memberName: 'two andonly',
            ahs: 5,
            ums: 3,
            likes: 2,
            other: 0,
            notes: 'Good content but work on reducing filler words',
          },
        ],
        overallNotes:
          'Overall filler word usage was moderate. Members should practice pause instead of using filler words.',
      },
    ];

    for (const { agenda, clubId } of generatedAgendas) {
      const clubMembers = membersByClub.get(clubId) ?? [];
      if (agenda.roleName === 'Grammarian') {
        const evals = pickN(clubMembers, randInt(2, 4)).map((m: any) => ({
          memberId: m.userId ?? null,
          memberName: m.memberName,
          wordUsageCount: randInt(0, 6),
          examples: [
            `used the word of the day naturally in a story`,
            `strong contextual usage`,
          ],
          grammarIssues: pick(['None', 'Minor: tense shift', 'Used filler word', 'Good article use']),
        }));
        reports.push({
          id: randomUUID(),
          agendaId: agenda.id,
          reportType: ReportType.GRAMMARIAN,
          wordOfTheDay: pick(WORDS_OF_DAY),
          wordOfTheDayDefinition:
            'A powerful word chosen to encourage its use throughout the meeting.',
          grammarNotes: pick(GRAMMAR_NOTES),
          memberEvaluations: evals,
          overallNotes: pick(GRAMMAR_NOTES),
        });
      } else if (agenda.roleName === 'Ah Counter') {
        const counts = pickN(clubMembers, randInt(2, 4)).map((m: any) => ({
          memberId: m.userId ?? null,
          memberName: m.memberName,
          ahs: randInt(0, 9),
          ums: randInt(0, 7),
          likes: randInt(0, 4),
          other: randInt(0, 5),
          notes: pick(FILLER_NOTES),
        }));
        reports.push({
          id: randomUUID(),
          agendaId: agenda.id,
          reportType: ReportType.AH_COUNTER,
          fillerWordCounts: counts,
          overallNotes: pick(FILLER_NOTES),
        });
      }
    }

    await this.agendaReportRepository.save(reports);
    console.log(`✅ Agenda reports created (${reports.length})`);

    console.log('🎉 Database seeding completed successfully!');
  }
}
