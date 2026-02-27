import { z } from "zod";

export interface IConfig {
    workingDir : string;
}

export const zModelSettings = z.object({
    accuracy: z.number().describe("The accuracy of the model"),
    name: z.string().describe("The name of the model"),
    description: z.string().describe("The description of the model"),
    model_type: z.string().describe("The type of the model like random forest, linear regression, etc."),
    thoughts: z.string().describe("Why did you choose this model type? Explain in detail."),
    inputs: z.array(z.object({
        type: z.enum(["string", "number"]).describe("The type of the input eg. string, number"),
        name: z.string().describe("The name of the input eg. age, gender"),
        description: z.string().describe("The description of the input eg. The age of the customer"),
    })).describe("The inputs of the model"),
})

export type TModelSettings = z.infer<typeof zModelSettings>;