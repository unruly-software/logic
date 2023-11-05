import { expect, it } from 'vitest'
import { Rule } from '../src/Rule'

const { true: t, false: f } = Rule

it('evaluates ors', () => {
  expect(t.or(f).isSatisfied()).resolves.toBe(true)
  expect(f.or(t).isSatisfied()).resolves.toBe(true)
  expect(t.or(t).isSatisfied()).resolves.toBe(true)
  expect(f.or(f).isSatisfied()).resolves.toBe(false)
  expect(t.or(f).name).toMatchInlineSnapshot('"(true or false)"')
})

it('evaluates ands', () => {
  expect(t.and(f).isSatisfied()).resolves.toBe(false)
  expect(f.and(t).isSatisfied()).resolves.toBe(false)
  expect(t.and(t).isSatisfied()).resolves.toBe(true)
  expect(f.and(f).isSatisfied()).resolves.toBe(false)
  expect(t.and(f).name).toMatchInlineSnapshot('"(true and false)"')
})

it('evaluates nots', () => {
  expect(t.notThis().isSatisfied()).resolves.toBe(false)
  expect(f.notThis().isSatisfied()).resolves.toBe(true)
  expect(t.notThis().name).toMatchInlineSnapshot('"not true"')
})

it('evaluates xors', () => {
  expect(t.xor(f).isSatisfied()).resolves.toBe(true)
  expect(f.xor(t).isSatisfied()).resolves.toBe(true)
  expect(t.xor(t).isSatisfied()).resolves.toBe(false)
  expect(f.xor(f).isSatisfied()).resolves.toBe(false)
  expect(t.xor(f).name).toMatchInlineSnapshot('"(true xor false)"')
})

it('evalutes orNot', () => {
  expect(t.orNot(f).isSatisfied()).resolves.toBe(true)
  expect(f.orNot(t).isSatisfied()).resolves.toBe(false)
  expect(t.orNot(t).isSatisfied()).resolves.toBe(true)
  expect(f.orNot(f).isSatisfied()).resolves.toBe(true)
  expect(t.orNot(f).name).toMatchInlineSnapshot('"(true or not false)"')
})

it('evalutes andNot', () => {
  expect(t.andNot(f).isSatisfied()).resolves.toBe(true)
  expect(f.andNot(t).isSatisfied()).resolves.toBe(false)
  expect(t.andNot(t).isSatisfied()).resolves.toBe(false)
  expect(f.andNot(f).isSatisfied()).resolves.toBe(false)
  expect(t.andNot(f).name).toMatchInlineSnapshot('"(true and not false)"')
})

it('evaluates complex expressions', () => {
  const rule = t.and(f.or(t).andNot(f.or(t))).andNot(t.or(f).and(t.or(f)))

  expect(rule.name).toMatchInlineSnapshot(
    '"((true and ((false or true) and not (false or true))) and not ((true or false) and (true or false)))"',
  )

  expect(rule.isSatisfied()).resolves.toBe(false)
})

interface User {
  roles: ('admin' | 'manager')[]
}

const isAdmin = Rule.of('isAdmin', async (user: User, e) => {
  if (user.roles.includes('admin')) {
    return true
  }
  e.addIssue('User is not an admin')
  return false
})

const isManager = Rule.of('isManager', async (user: User, e) => {
  if (user.roles.includes('manager')) {
    return true
  }
  e.addIssue('User is not a manager')
  return false
})

it('evaluates expressions requiring context', async () => {
  await expect(
    isManager.or(isAdmin).isSatisfied({
      roles: ['admin'],
    }),
  ).resolves.toBe(true)

  await expect(
    isManager.or(isAdmin).isSatisfied({
      roles: ['manager'],
    }),
  ).resolves.toBe(true)

  await expect(
    isManager.or(isAdmin).isSatisfied({
      roles: [],
    }),
  ).resolves.toBe(false)

  const explained = await isManager.or(isAdmin).explain({
    roles: [],
  })

  expect(explained.getFailedRuleIssues()).toMatchInlineSnapshot(`
    [
      "User is not a manager",
      "User is not an admin",
    ]
  `)
  expect(explained.getRuleIssues()).toMatchInlineSnapshot(`
    {
      "isAdmin": {
        "issues": [
          "User is not an admin",
        ],
        "result": false,
      },
      "isManager": {
        "issues": [
          "User is not a manager",
        ],
        "result": false,
      },
    }
  `)
})
