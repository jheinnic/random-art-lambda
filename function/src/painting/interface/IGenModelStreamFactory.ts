import { Observable } from "rxjs"
import { GenModel } from "../components/genjs6.js"
import { PaintingTask } from "../../seeding/models/PaintingTask.js"

export interface IGenModelStreamFactory {
   adapt: (source: Observable<PaintingTask>) => Observable<GenModel>
}
