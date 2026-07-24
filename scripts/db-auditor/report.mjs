/**
 * Result helpers and final report printer for Database Auditor v1.
 *
 * Status semantics:
 * - PASS  — contract check succeeded
 * - FAIL  — contract violation (causes non-zero exit)
 * - WARN  — noteworthy drift / known gap (does not fail the run)
 * - SKIP  — check could not run (missing dependency / connection)
 */

export const STATUS = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL',
  WARN: 'WARN',
  SKIP: 'SKIP'
})

/**
 * @param {'PASS'|'FAIL'|'WARN'|'SKIP'} status
 * @param {string} check
 * @param {string} message
 * @param {object} [details]
 */
export function createResult(status, check, message, details = undefined) {
  const result = { status, check, message }
  if (details !== undefined) {
    result.details = details
  }
  return result
}

export function pass(check, message, details) {
  return createResult(STATUS.PASS, check, message, details)
}

export function fail(check, message, details) {
  return createResult(STATUS.FAIL, check, message, details)
}

export function warn(check, message, details) {
  return createResult(STATUS.WARN, check, message, details)
}

export function skip(check, message, details) {
  return createResult(STATUS.SKIP, check, message, details)
}

/**
 * @param {Array<{status:string}>} results
 */
export function summarize(results) {
  const summary = { PASS: 0, FAIL: 0, WARN: 0, SKIP: 0, total: results.length }

  for (const result of results) {
    if (summary[result.status] === undefined) {
      summary[result.status] = 0
    }
    summary[result.status] += 1
  }

  return summary
}

/**
 * @param {Array<{status:string}>} results
 */
export function hasFailures(results) {
  return results.some((result) => result.status === STATUS.FAIL)
}

function statusIcon(status) {
  switch (status) {
    case STATUS.PASS:
      return '✅'
    case STATUS.FAIL:
      return '❌'
    case STATUS.WARN:
      return '⚠️'
    case STATUS.SKIP:
      return '⏭️'
    default:
      return '•'
  }
}

/**
 * @param {object} options
 * @param {string} options.title
 * @param {Array<object>} options.results
 * @param {Array<{name:string, results:Array<object>}>} [options.sections]
 */
export function printReport({ title, results, sections = [] }) {
  const summary = summarize(results)

  console.log('\n============================================================')
  console.log(title)
  console.log('============================================================\n')

  for (const section of sections) {
    console.log(`── ${section.name}`)
    for (const result of section.results) {
      console.log(`  ${statusIcon(result.status)} [${result.status}] ${result.check}`)
      console.log(`     ${result.message}`)
      if (result.details !== undefined) {
        console.log(`     details: ${JSON.stringify(result.details)}`)
      }
    }
    console.log('')
  }

  console.log('------------------------------------------------------------')
  console.log(
    `Summary: ${summary.PASS} PASS · ${summary.FAIL} FAIL · ${summary.WARN} WARN · ${summary.SKIP} SKIP · ${summary.total} total`
  )
  console.log('------------------------------------------------------------\n')

  if (summary.FAIL > 0) {
    console.log('❌ Database Auditor finished with FAIL items.\n')
  } else {
    console.log('✅ Database Auditor finished without FAIL items.\n')
  }

  return summary
}
