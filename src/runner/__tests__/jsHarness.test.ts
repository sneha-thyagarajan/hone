import { describe, expect, it } from 'vitest'
import { runJs } from '../jsHarness'

describe('runJs', () => {
  it('captures console.log output', () => {
    expect(runJs('console.log("hi")')).toEqual({ output: 'hi' })
  })

  it('captures multiple lines and evaluated values', () => {
    const { output } = runJs('console.log(1 + 1); console.log("x", 2)')
    expect(output).toBe('2\nx 2')
  })

  it('stringifies objects and arrays', () => {
    expect(runJs('console.log([1,2], {a:1})').output).toBe('[1,2] {"a":1}')
  })

  it('captures a runtime error and keeps output so far', () => {
    const r = runJs('console.log("before"); throw new Error("boom")')
    expect(r.output).toBe('before')
    expect(r.error).toContain('boom')
  })

  it('reports a syntax error', () => {
    const r = runJs('function (')
    expect(r.error).toBeTruthy()
    expect(r.output).toBe('')
  })

  it('runs loops and accumulations', () => {
    const r = runJs('let s=0; for(let i=1;i<=5;i++) s+=i; console.log(s)')
    expect(r.output).toBe('15')
  })
})
