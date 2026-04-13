// Type declaration for lunar-javascript (no official @types package)
declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar
    getYear(): number
    getMonth(): number
    getDay(): number
    getLunar(): Lunar
    getEightChar(): EightChar
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar
    static fromSolar(solar: Solar): Lunar
    getSolar(): Solar
    getEightChar(): EightChar
    static fromDate(date: Date): Lunar
  }

  export class EightChar {
    getYearGan(): string
    getYearZhi(): string
    getMonthGan(): string
    getMonthZhi(): string
    getDayGan(): string
    getDayZhi(): string
    getTimeGan(): string
    getTimeZhi(): string
  }
}
