import { Entity, Property, ManyToOne, Enum } from "@mikro-orm/core";
import { Crop } from "./Crop.js";
import { Organization } from "./Organization.js";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class Harvest extends BaseEntity {
  @Property()
  quantity!: number;

  @Enum(() => HarvestUnit)
  unit!: HarvestUnit;

  @ManyToOne(() => Crop)
  crop!: Crop;

  @ManyToOne(() => Organization)
  organization!: Organization;
}

export enum HarvestUnit {
  KG = 'kg',
  BUSHEL = 'bushel',
  CRATE = 'crate',
} 