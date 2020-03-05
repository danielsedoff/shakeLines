// *****************************************************************************
//
// This file is a part of the <shakeLines> distribution.
// This distribution is subject to MIT license. (written below)
//
// shakeLines performs line permutations (as if you used a shaker) for JavaScript
// code in order to find quicker variants of the same code by moving lines around.
// Permutations are slow. The function order for permutations is O(n!)

// Use example 1: optimize some code which works but can run faster. 
// -----------------------------------------------------------------------------

const useSampleOptimize = () => {
  return shakeLines(
    'x = Math.random();\ny = 0; \nx *= y; \na = 3; \nreturn (a * x); \nreturn 0;',
    ['n', 'm'],
    0
  )
}

useSampleOptimize()

// Use example 2: this code doesn't work now but it will work when shaked well. 
// -----------------------------------------------------------------------------


const useSampleRecovery = () => {
  return shakeLines(
    'return undefined;\nx = Math.random();\ny = 0; \nx *= y; \na = 3; \nreturn (a * x); \nreturn 0;',
    ['n', 'm'],
    0
  )
}

useSampleRecovery()


// Use example 3: this code doesn't work and it won' work no matter what. 
// -----------------------------------------------------------------------------

const useSampleNoSolution = () => {
  return shakeLines(
    'return undefined;\nx = 1;\ny=2;\nz=3;\n',
    ['z','q'],
    1
  )
}

useSampleOptimize()


var resultContainer = {
  // This object stores the results.
  // Values are written by setters.

  fastestCode: '',
  currentBestTime: Infinity,
  recoveryEnabled: false,
  iterationCount: 10000,

  setFastestCode: (newFastestCode: string) => {
    resultContainer.fastestCode = newFastestCode
  },

  setBestTime: (newBestTime: number) => {
    resultContainer.currentBestTime = newBestTime
  },

  enableRecovery: () => {
    resultContainer.recoveryEnabled = true
  }
}

const shakeLines = (
  plainTextJavascript: string,
  inputArguments: any,
  expectedOutput: any
) => {
  // This is the main function.
  // Takes plain text Javascript, an array of arguments,
  // and the expected output.

  resultContainer.setFastestCode(plainTextJavascript)
  const originalCodeLineArray = plainTextJavascript.split('\n')

  if (
    !returnsAsExpected(originalCodeLineArray, inputArguments, expectedOutput)
  ) {
    resultContainer.enableRecovery()
    console.log(
      'WARN: This code does not return what is expected. Recovery mode enabled.'
    )
  }

  const originalCodeTiming = resultContainer.recoveryEnabled
    ? Infinity
    : avgMsecPerCall(originalCodeLineArray, inputArguments)
  resultContainer.setBestTime(originalCodeTiming)

  const fullPermutationTime =
    originalCodeTiming *
    resultContainer.iterationCount *
    factorial(originalCodeLineArray.length)
  console.log('Estimated time to finish: ' + fullPermutationTime + ' ms')

  // Now call the permutation function. It permutes the lines in all possible
  // combinations to find the quickest variant. In case of 'recovery' it will
  // stop at the first working variant, if any.

  permuteLines([], originalCodeLineArray, checkThisPermutation, [
    inputArguments,
    expectedOutput
  ])

  const messageHeader = resultContainer.recoveryEnabled
    ? 'Working variant:\n\n'
    : 'Fastest variant:\n\n'
  
  if (resultContainer.currentBestTime == Infinity) {
    resultContainer.setFastestCode('** NO SOLUTION FOUND **')
  }

  console.log(messageHeader + resultContainer.fastestCode)
  console.log('Current best time: ' + resultContainer.currentBestTime)
  console.log('- END -')
}

const checkThisPermutation = (
  currentPermutationString: string,
  [inputArguments, expectedOutput]: [string[], any]
) => {
  if (
    !returnsAsExpected(
      currentPermutationString.split('\n'),
      inputArguments,
      expectedOutput
    )
  )
    return false
  const currentPermutationTime = avgMsecPerCall(
    currentPermutationString.split('\n'),
    inputArguments
  )
  if (currentPermutationTime < resultContainer.currentBestTime) {
    resultContainer.setFastestCode(currentPermutationString)
    resultContainer.setBestTime(currentPermutationTime)
  }
  return true
}

const factorial = (n: number) => {
  return n < 2 ? 1 : n * factorial(n - 1)
}

const returnsAsExpected = (
  codeLineArray = ['return 0', ' '],
  inputArguments = ['', ''],
  expectedOutput = 0
) => {
  try {
    let newFunction = Function(...inputArguments, codeLineArray.join('\n'))
    let actualResults = newFunction()
    // console.log(`actualResults: ${actualResults}`)
    if (actualResults != expectedOutput) return false
    // the code works but yields a wrong result
  } catch (e) {
    console.log('error:' + e)
    return false
    // the code doesn't work
  }
  return true
  // it works and yields the right result
}

const avgMsecPerCall = (codeLineArray: string[], inputArguments: string[]) => {
  // TODO: This value must be automatically adjusted
  // depending on the real code speed.
  const startTime = Date.now()

  let limitCounter = 0
  let limitCheckPoint = resultContainer.iterationCount / 100

  for (let i = 0; i < resultContainer.iterationCount; ++i) {
    // If this variant will be no faster than the current record
    // then there is no use in continuing this run
    ++limitCounter
    if (limitCounter >= limitCheckPoint) {
      let currentRuntime = Date.now() - startTime
      // if it has already taken too much time, exit
      if (
        currentRuntime >=
        resultContainer.currentBestTime * resultContainer.iterationCount
      ) {
        return resultContainer.currentBestTime
      }
      limitCounter = 0
    }
    let newFunction = Function(...inputArguments, codeLineArray.join('\n'))
    let actualResults = newFunction()
    if (actualResults === '!!$^)&*_!#UnlikelyReturn%($') return NaN
  }
  const newTime = Date.now()
  return (newTime - startTime) / resultContainer.iterationCount
}

const permuteLines = (
  header: string[],
  body: string[],
  callback,
  additionalArgs: string[]
) => {
  if (body.length == 1) {
    let currentpermutation = [].concat(header, body[0])
    let currentPermutationString = currentpermutation.join('\n')

    // console.log('currentPermutationString: ' + currentPermutationString)
    // console.log('additionalArgs: ' + additionalArgs)

    let callbackResult = callback(currentPermutationString, additionalArgs)
    if (resultContainer.recoveryEnabled === true && callbackResult === true)
      return true
    // main entry point
  } else {
    for (let i = 0; i < body.length; ++i) {
      let newHead = body[i]
      let newArr = body.slice()
      newArr.splice(i, 1)
      let myOwnResult = permuteLines(
        header.concat(newHead),
        newArr,
        callback,
        additionalArgs
      )
      if (myOwnResult === true) return true
    }
  }
}

