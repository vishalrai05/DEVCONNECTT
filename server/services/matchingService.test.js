import assert from 'node:assert/strict'
import test from 'node:test'
import { rankCandidates, scoreCandidate } from './matchingService.js'

const seeker = {
  skills: ['React', 'JavaScript'],
  preferredRole: 'Frontend Developer',
  projectInterests: ['AI / Machine Learning', 'Web Applications'],
  availability: 'Available now',
  experienceLevel: 'Intermediate',
}

test('scores complementary backend skills and shared interests', () => {
  const result = scoreCandidate(seeker, {
    name: 'Backend teammate',
    skills: ['Node.js', 'Express'],
    preferredRole: 'Backend Developer',
    projectInterests: ['AI / Machine Learning'],
    availability: 'Available now',
    experienceLevel: 'Intermediate',
  })

  assert.ok(result)
  assert.ok(result.matchScore > 50)
  assert.deepEqual(result.complementarySkills, ['Node.js', 'Express'])
  assert.equal(result.breakdown.role, 100)
  assert.match(result.reason, /complementary/i)
})

test('excludes unavailable candidates by default', () => {
  const result = scoreCandidate(seeker, {
    name: 'Unavailable teammate',
    skills: ['React'],
    preferredRole: 'Frontend Developer',
    availability: 'Not available',
    experienceLevel: 'Intermediate',
  })

  assert.equal(result, null)
})

test('ranks candidates by descending score', () => {
  const ranked = rankCandidates(seeker, [
    {
      name: 'Low fit',
      skills: ['Solidity'],
      preferredRole: 'Blockchain Developer',
      availability: 'Available this month',
      experienceLevel: 'Beginner',
    },
    {
      name: 'High fit',
      skills: ['Node.js', 'Express'],
      preferredRole: 'Backend Developer',
      projectInterests: ['Web Applications'],
      availability: 'Available now',
      experienceLevel: 'Intermediate',
    },
  ])

  assert.equal(ranked[0].candidate.name, 'High fit')
  assert.ok(ranked[0].matchScore >= ranked[1].matchScore)
})
