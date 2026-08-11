import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../src/lib/server/generated/prisma/client.ts';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const total = await prisma.jobPostings.count();
const sample = await prisma.jobPostings.findMany({
	take: 10,
	orderBy: { file_creation_date: 'desc' },
	select: {
		row_id: true,
		title: true,
		degree_area: true,
		degrees: true,
		education_level: true,
		qualification_level: true,
		grade: true,
		min_age: true,
		max_age: true,
		place_of_posting: true,
		domicile: true,
		active: true,
		last_date_to_apply: true,
		file_creation_date: true,
		department: true
	}
});

const distinctEdu = await prisma.jobPostings.findMany({
	where: { education_level: { not: null } },
	distinct: ['education_level'],
	select: { education_level: true },
	take: 50
});
const distinctGrade = await prisma.jobPostings.findMany({
	where: { grade: { not: null } },
	distinct: ['grade'],
	select: { grade: true },
	take: 50
});

const withDegrees = await prisma.jobPostings.findMany({
	where: { OR: [{ degree_area: { not: null } }, { degrees: { not: null } }] },
	take: 15,
	select: { degree_area: true, degrees: true }
});

console.log(
	JSON.stringify(
		{
			total,
			sample,
			education_levels: distinctEdu.map((e) => e.education_level),
			grades: distinctGrade.map((g) => g.grade),
			degreeSamples: withDegrees
		},
		null,
		2
	)
);

await prisma.$disconnect();
await pool.end();
