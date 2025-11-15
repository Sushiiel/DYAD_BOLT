import { relations } from "drizzle-orm/relations";
import { apps, chats, messages, languageModelProviders, languageModels, versions, boltProjects, boltFiles } from "./schema";

export const chatsRelations = relations(chats, ({one, many}) => ({
	app: one(apps, {
		fields: [chats.appId],
		references: [apps.id]
	}),
	messages: many(messages),
}));

export const appsRelations = relations(apps, ({many}) => ({
	chats: many(chats),
	versions: many(versions),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	chat: one(chats, {
		fields: [messages.chatId],
		references: [chats.id]
	}),
}));

export const languageModelsRelations = relations(languageModels, ({one}) => ({
	languageModelProvider: one(languageModelProviders, {
		fields: [languageModels.customProviderId],
		references: [languageModelProviders.id]
	}),
}));

export const languageModelProvidersRelations = relations(languageModelProviders, ({many}) => ({
	languageModels: many(languageModels),
}));

export const versionsRelations = relations(versions, ({one}) => ({
	app: one(apps, {
		fields: [versions.appId],
		references: [apps.id]
	}),
}));

export const boltFilesRelations = relations(boltFiles, ({one}) => ({
	boltProject: one(boltProjects, {
		fields: [boltFiles.projectId],
		references: [boltProjects.id]
	}),
}));

export const boltProjectsRelations = relations(boltProjects, ({many}) => ({
	boltFiles: many(boltFiles),
}));