import { Entity, Property, ManyToOne } from "@mikro-orm/core";
import { Organization } from "./Organization.js";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class Crop extends BaseEntity {
  @Property()
  name!: string;

  @Property()
  plantingDate!: Date;

  @ManyToOne(() => Organization)
  organization!: Organization;
} 