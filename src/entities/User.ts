import { Entity, Property, ManyToOne, Unique } from "@mikro-orm/core";
import { Organization } from "./Organization.js";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class User extends BaseEntity {
  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Property()
  @Unique()
  email!: string;

  @ManyToOne(() => Organization)
  organization!: Organization;
} 