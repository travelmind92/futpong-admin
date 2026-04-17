export const createBatches = <T>(list: T[], batchSize = 25): T[][] => {
    const batches: T[][] = []
    for (let i = 0; i < list.length; i += batchSize) {
        batches.push(list.slice(i, i + batchSize))
    }
    return batches
}
