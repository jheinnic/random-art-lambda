import { AsyncCallRequest, RemoteRequest } from "../interface/index.js"

/*
-- Problem -> SmallerProblem[] S:=> [SmallerProblem] -> [SmallerSolutions] G:=> SmallerSolutions[] -> Solution
-- Problem -> SmallerProblem[] S:=> [SmallerProblem]
   [SmallerProblem] -> [SmallerSolutions] G:=> SmallerSolutions[]
   SmallerSolutions[] -> Solution

-- Problem Distribute:=> <Delegate:=>>
   Problem Split: -> Tagged(SmallerProblem)[] Scatter:=> <Delegate:=>>
   Tagged(SmallerProblem) Solve: -> Tagged(SmallerSolution) Gather:=> <Delegate:=>>
   SmallerSolutions[] Combine: -> Solution -> <Delegate:=>>
   Solution Solve:-> Staged -> <Delegate:=>>

-- Problem Delegate:=> Problem
   Problem Split:=> SmallerProblem[]
   SmallerProblem[] Scatter:=> Tagged(SmallerProblem)*
   Tagged(SmallerProblem)* Solve:=> Tagged(SmallerSolutions)*
   Tagged(SmalerSolutions)* Gather:=> SmallerSolutions[]
   SmallerSolutions[] Combine:=> Solution

-- MultiProblem Split:-> Problem[] Scatter_M:=> <Delegate:=>>
   Tagged_M(Problem) Split:-> Tagged_M(SmallerProblem)[] Scatter_D:=> <Delegate:=>>
   Tagged_D,Tagged_M(SmallerProblem) Solve:-> Tagged_D,Tagged_M(SmallerSolution) Gather_D:=> <Delegate:=>>
   Tagged_M(SmallerSolution)[] Combine-> Tagged_M(Solution) :Solve-> Tagged_M(Proxy) Gather_M:=> <Delegate:=>>
   Proxy[] Combine:=> MultiSolution

-- MultiProblem Split:-> Tagged_M(Problem)[] Scatter_M:=> <Delegate:=>>
   Tagged_M(Problem) Split:-> Tagged_D,Tagged_M(SmallerProblem)[] Scatter_D:=> <Delegate:=>>
   Tagged_D,Tagged_M(SmallerProblem) Solve:-> Tagged_D,Tagged_M(SmallerSolution) Gather_D:=> <Delegate:=>>
   Tagged_M(SmallerSolution)[] Combine-> Tagged_M(Solution) :Solve-> Tagged_M(Proxy) Gather_M:=> <Delegate:=>>
   Proxy[] Combine:=> MultiSolution

      (1, 2, 3, 4, 5) -> [1, 2, 3, 4, 5] -> {
         [1A], [2A], [3A], [4A], [5A]
      } -> {
         [1A.1, 1A.2, 1A.3], [2A.1, 2A.2, 2A.3], [3A.1, 3A.2], [4A.1, 4A.2, 4A.3], [5A.1, 5A.2]
      } -> {
         [1A.1C], [1A.2C], [1A.3C], [2A.1B], [2A.2B], [2A.3B], [3A.1A], [3A.2A], [4A.1D], [4A.2D], [4A.3D], [5A.1C], [5A.2C]
      } -> {
         [1A.1C], [1A.2C], [1A.3C], [2A.1B], [2A.2B], [2A.3B], [3A.1A], [3A.2A], [4A.1D], [4A.2D], [4A.3D], [5A.1C], [5A.2C]
      }

-- MultiProblem Split:=> Problem[] Split:= SmallerProblem[][]
  SmallerProblem[][] Scatter:=> [[SmallerProblem]]
  [[SmallerProblem]] Solve:=> [[SmallerSolution]]
[[SmallerSolution]] Gather:=> [SmallerSolution[]]
[SmallerSolution[]] Combine:=> [Solution]
[Solution] Solve:=> [Proxy]
[Proxy] Gather:=> Proxy[]
Proxy[] Combine:=> MultiSolution

   S:=> [Problem] -> [SmallerProblem[]] S:=> [[SmallerProblem]] -> [[SmallerSolutions]] G:=> [SmallerSolutions[]] -> [Solution] G:=> Solution[] -> MultiSolution[]

-- MultiProblem Split:=> Problem[] Split:= SmallerProblem[][]
  SmallerProblem[][] Scatter:=> [[SmallerProblem]]
  [[SmallerProblem]] Solve:=> [[SmallerSolution]]
[[SmallerSolution]] Gather:=> [SmallerSolution[]]
[SmallerSolution[]] Combine:=> [Solution]
[Solution] Solve:=> [Proxy]
[Proxy] Gather:=> Proxy[]
Proxy[] Combine:=> MultiSolution

   S:=> [Problem] -> [SmallerProblem[]] S:=> [[SmallerProblem]] -> [[SmallerSolutions]] G:=> [SmallerSolutions[]] -> [Solution] G:=> Solution[] -> MultiSolution[]
-- MultiProblem -> Problem[] S:=> [Problem]
   [Problem] -> [SmallerProblem[]] S:=> [[SmallerProblem]]
   [[SmallerProblem]] -> [[SmallerSolutions]] G:=> [SmallerSolutions[]]
   [SmallerSolution[]] -> [Solution] G:=> Solution[]
   [Solution] G:=> Solution[] -> MultiSolution[]
-- MultiProblem -> Problem[] -> SmallerProblem[][] S:=> [[SmallerProblem]] -> [[SmallerSolutions]] G:=> SmallerSolutions[][] -> Solution[] -> MultiSolution
S:=> [Problem] -> [SmallerProblem[]] S:=> [[SmallerProblem]] -> [[SmallerSolutions]] G:=> [SmallerSolutions[]] -> [Solution] G:=> Solution[] -> MultiSolution[]
*/

export interface HooksForOneToOne<Request, Reply> {
   LocalCall: AsyncCallRequest<Request, Reply>
   QueueCall: RemoteRequest<Request, Reply>
   FlowStep: RemoteRequest<Request, Reply>
}
