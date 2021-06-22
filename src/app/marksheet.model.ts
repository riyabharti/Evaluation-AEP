export class Marksheet {
    constructor(){
       this.subDetails =  new subDetails();
       this.marks = new marks();
    }
    subDetails: subDetails;
    marks?: marks;
}

export class subDetails {
    subCode: string;
    sec: string;
    examName: string;
  }
  
  export class marks {
    name: string;
    roll: string;
    score: number;
  }