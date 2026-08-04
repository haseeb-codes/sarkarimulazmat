import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../src/lib/server/generated/prisma/client.ts';

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, max: 2 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const categories = [
	{
		slug: 'medical-jobs',
		title: 'Medical & Healthcare Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Medical & healthcare government jobs',
		meta_description:
			'Browse government medical jobs in Pakistan — doctors, specialists, and healthcare roles with eligibility filters.',
		intro_content:
			'Public-sector medical posts are advertised by provincial health departments, PPHI, and teaching hospitals. Candidates typically hold an MBBS or postgraduate qualification in a relevant specialty.',
		filters: { degree_areas: ['Medicine', 'MBBS', 'Cardiology', 'Paediatrics', 'Dermatology'] }
	},
	{
		slug: 'engineering-jobs',
		title: 'Engineering Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Engineering government jobs',
		meta_description:
			'Find government engineering jobs in Pakistan across civil, electrical, and related disciplines.',
		intro_content:
			'Government engineering roles are regularly advertised by public works, irrigation, WAPDA-linked bodies, and development authorities. Eligible candidates typically hold a BE/BSc Engineering in a relevant discipline.',
		filters: { degree_areas: ['Engineering', 'Civil', 'Electrical', 'Mechanical'] }
	},
	{
		slug: 'mba',
		title: 'MBA & Business Administration Government Jobs — Sarkari Mulazmat',
		h1: 'MBA & business administration jobs',
		meta_description:
			'Government jobs seeking MBA or business administration qualifications in Pakistan.',
		intro_content:
			'Management, finance, and administrative posts in public corporations and government departments often list MBA or business administration among preferred qualifications.',
		filters: { degree_areas: ['Business Administration', 'MBA', 'Finance'] }
	},
	{
		slug: 'law-jobs',
		title: 'Law & Legal Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Law & legal government jobs',
		meta_description:
			'Browse government legal and law-related job postings in Pakistan.',
		intro_content:
			'Legal officer, counsel, and related posts appear across public-sector corporations and government departments. Candidates typically hold an LLB or related law qualification.',
		filters: { degree_areas: ['Law'] }
	},
	{
		slug: 'teaching-jobs',
		title: 'Teaching & Education Government Jobs — Sarkari Mulazmat',
		h1: 'Teaching & education government jobs',
		meta_description:
			'Find government teaching and education jobs in Pakistan, including school and college posts.',
		intro_content:
			'Public schools, colleges, and education departments advertise teaching and academic administration roles. Requirements often include a Master’s degree and education qualifications such as M.Ed.',
		filters: { degree_areas: ['Education'], education_level: "Master's" }
	},
	{
		slug: 'bs-cs',
		title: 'BS Computer Science & IT Government Jobs — Sarkari Mulazmat',
		h1: 'Computer science & IT government jobs',
		meta_description:
			'Government IT and computer science jobs in Pakistan for BCS, BIT, and related graduates.',
		intro_content:
			'IT, software, and digital roles in the public sector typically seek BCS, BIT, BSE, or related computer science qualifications.',
		filters: { degree_areas: ['Computer', 'IT', 'Software', 'BCS'] }
	},
	{
		slug: 'intermediate-jobs',
		title: 'Intermediate-Level Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Intermediate-level government jobs',
		meta_description:
			'Government jobs in Pakistan open to Intermediate / FA / FSc qualified candidates.',
		intro_content:
			'Many clerical and support posts list Intermediate (FA/FSc) as the minimum education. Use age and domicile filters to narrow further.',
		filters: { education_level: 'Intermediate' }
	},
	{
		slug: 'matric-jobs',
		title: 'Matric-Level Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Matric-level government jobs',
		meta_description:
			'Government jobs in Pakistan open to Matric qualified candidates.',
		intro_content:
			'Support, peon, and similar posts often require Matric as the minimum qualification. Always confirm age limits and domicile on the official advertisement.',
		filters: { education_level: 'Matric' }
	},
	{
		slug: 'graduate-jobs',
		title: 'Graduate Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Graduate government jobs',
		meta_description:
			'Browse government jobs in Pakistan that require a Bachelor’s or graduate-level qualification.',
		intro_content:
			'Graduate-level posts span administration, finance, and technical cadres. Filter further by degree area and grade to match your background.',
		filters: { education_level: 'Graduate' }
	},
	{
		slug: 'balochistan-jobs',
		title: 'Government Jobs in Balochistan — Sarkari Mulazmat',
		h1: 'Government jobs in Balochistan',
		meta_description:
			'Find government job postings with Balochistan domicile or posting locations.',
		intro_content:
			'Provincial and federal posts based in Balochistan, including roles that require Balochistan domicile. Always verify domicile rules on the official advertisement.',
		filters: { domicile: 'Balochistan' }
	}
];

for (const cat of categories) {
	await prisma.categoryPage.upsert({
		where: { slug: cat.slug },
		create: cat,
		update: {
			title: cat.title,
			h1: cat.h1,
			meta_description: cat.meta_description,
			intro_content: cat.intro_content,
			filters: cat.filters,
			is_indexed: true
		}
	});
	console.log('upserted', cat.slug);
}

await prisma.$disconnect();
await pool.end();
