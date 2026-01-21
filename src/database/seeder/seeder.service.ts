import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Club } from 'src/modules/club/entities/club.entity';
import { ClubMember } from 'src/modules/club/entities/club-member.entity';
import { Meeting } from 'src/modules/meeting/entities/meeting.entity';
import { Agenda } from 'src/modules/agenda/entities/agenda.entity';
import { AgendaReport } from 'src/modules/agenda-report/entities/agenda-report.entity';
import { ClubRole } from 'src/modules/club/enum/club-role.enum';
import { ClubMeetingFrequency } from 'src/modules/club/enum/club-meeting-frequency.enum';
import { MEETING_STATUS } from 'src/modules/meeting/enum/meeting-status.enum';
import { ReportType } from 'src/modules/agenda-report/entities/agenda-report.entity';

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
    // Clear existing data
    await this.agendaReportRepository.delete({});
    await this.agendaRepository.delete({});
    await this.meetingRepository.delete({});
    await this.clubMemberRepository.delete({});
    await this.clubRepository.delete({});
    await this.userRepository.delete({});

    console.log('🌱 Starting database seeding...');

    // 1. Create Users
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

    await this.userRepository.save([userOne, userTwo]);
    console.log('✅ Users created');

    // 2. Create Clubs
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
    });

    await this.clubRepository.save([clubKathmandu, clubPatan, clubBhaktapur]);
    console.log('✅ Clubs created');

    // 3. Create Club Members
    const members = [
      // Kathmandu members
      {
        id: '11111111-1111-1111-1111-111111111111',
        userId: userOne.id,
        clubId: clubKathmandu.id,
        memberName: 'one andonly',
        memberEmail: 'one@sk.com',
        role: ClubRole.OWNER,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        userId: userTwo.id,
        clubId: clubKathmandu.id,
        memberName: 'two andonly',
        memberEmail: 'two@sk.com',
        role: ClubRole.MEMBER,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        userId: null,
        clubId: clubKathmandu.id,
        memberName: 'Guest Speaker Ram',
        memberEmail: 'ram@guest.com',
        role: ClubRole.MEMBER,
      },
      // Patan members
      {
        id: '44444444-4444-4444-4444-444444444444',
        userId: userOne.id,
        clubId: clubPatan.id,
        memberName: 'one andonly',
        memberEmail: 'one@sk.com',
        role: ClubRole.OWNER,
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        userId: null,
        clubId: clubPatan.id,
        memberName: 'Sita Sharma',
        memberEmail: 'sita@guest.com',
        role: ClubRole.MEMBER,
      },
      // Bhaktapur members
      {
        id: '66666666-6666-6666-6666-666666666666',
        userId: userTwo.id,
        clubId: clubBhaktapur.id,
        memberName: 'two andonly',
        memberEmail: 'two@sk.com',
        role: ClubRole.OWNER,
      },
      {
        id: '77777777-7777-7777-7777-777777777777',
        userId: userOne.id,
        clubId: clubBhaktapur.id,
        memberName: 'one andonly',
        memberEmail: 'one@sk.com',
        role: ClubRole.MEMBER,
      },
      {
        id: '88888888-8888-8888-8888-888888888888',
        userId: null,
        clubId: clubBhaktapur.id,
        memberName: 'Hari Prasad',
        memberEmail: 'hari@guest.com',
        role: ClubRole.MEMBER,
      },
    ];

    await this.clubMemberRepository.save(members);
    console.log('✅ Club members created');

    // 4. Create Meetings
    const meetings = [
      // Scheduled meetings
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
      // Completed meetings
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

    await this.meetingRepository.save(meetings);
    console.log('✅ Meetings created');

    // 5. Create Agendas
    const agendas = [
      // Meeting 3 agendas
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
        date: new Date('2025-12-15'),
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
        date: new Date('2025-12-15'),
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
        date: new Date('2025-12-15'),
        notes: 'Tracked filler words effectively',
      },
    ];

    await this.agendaRepository.save(agendas);
    console.log('✅ Agendas created');

    // 6. Create Agenda Reports
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
            memberId: '11111111-1111-1111-1111-111111111111',
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
            memberId: '11111111-1111-1111-1111-111111111111',
            memberName: 'one andonly',
            ahs: 2,
            ums: 1,
            likes: 0,
            other: 1,
            notes: 'Very controlled speaking, minimal filler words',
          },
          {
            memberId: '22222222-2222-2222-2222-222222222222',
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

    await this.agendaReportRepository.save(reports);
    console.log('✅ Agenda reports created');

    console.log('🎉 Database seeding completed successfully!');
  }
}
