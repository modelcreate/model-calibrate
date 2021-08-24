import { modelResult } from "./testData/out";
import { EpanetProlog, readBinary } from ".";

const fs = require("fs");
const data = fs.readFileSync(__dirname + "/testData/in.bin");

it("is a dummy test", () => {
  expect(1).toEqual(1);
});

//it('get results from binary', () => {
//
//  const results = readBinary(data)
//  expect(results).toEqual(modelResult)
//
//})

//it('getResultByteOffSet', () => {
//
//  const prolog: EpanetProlog = modelResult.prolog
//
//  const result = getResultByteOffSet(prolog, 0, NodeResultTypes.Demand)
//
//  const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
//
//  expect(result).toEqual(expected)
//
//})

//it('size is correct', () => {
//
//
//  const view1 = new DataView(data.buffer);
//
//  const nodeCount = view1.getInt32(8, true) // 11
//  const resAndTankCount = view1.getInt32(12, true) // 2
//  const linkCount = view1.getInt32(16, true) // 13
//  const pumpCount = view1.getInt32(20, true) // 1
//  const valveCount = view1.getInt32(24, true) // 0
//  const reportingPeriods = view1.getInt32(data.byteLength - 12, true) // 25
//
//
//  const prologByteSize = 852 + (20 * nodeCount) + (36 * linkCount) + (8 * resAndTankCount) //1556
//  const energyUseByteSize = (28 * pumpCount) + 4 //32
//  const dynamicResultsByteSize = ((16 * nodeCount) + (32 * linkCount)) * (reportingPeriods) //14800
//  const EpilogByteSize = 28 //28
//
//  const offsetNodeIDs = 884
//  const offsetLinkIDs = offsetNodeIDs + (32 * nodeCount)
//  const offsetNodeResults = offsetNodeIDs + (36 * nodeCount) + (52 * linkCount) + (8 * resAndTankCount) + (28 * pumpCount) + 4
//  const offsetLinkResults = 16 * nodeCount + offsetNodeResults
//
//  const resultSize = 16 * nodeCount + 32 * linkCount
//
//  const resultPeriod = 0
//  const nodeIndex = 0
//
//  const demand1 = view1.getFloat32(offsetNodeResults + (resultSize * resultPeriod) + (4 * nodeIndex), true)
//
//  expect(demand1).toEqual(0)
//
//
//})
