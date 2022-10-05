import stripIndent from 'strip-indent';
import { Util                          } from '../../../util/Util';
import { CoinflipClient                } from '../client/CoinflipClient';
import { LogEmbed                      } from './LogEmbed';
import { ResolvedChannelTypeUnion      } from './ResolvedChannelTypeUnion';
import { ModerationLoggerConfigManager } from './config/ModerationLoggerConfigManager';
import { DiscordFormatter              } from '../DiscordFormatter';
import { ModerationLoggerLevel         } from './ModerationLoggerLevel';
import {
  Snowflake,
  GuildChannel,
  TextChannel,
  VoiceChannel,
  GuildEmoji,
  GuildBan,
  Role,
  Sticker,
  Message,
  GuildAuditLogsEntry,
  PermissionsString,
  Webhook,
  NonThreadGuildBasedChannel,
  GuildAuditLogsTargetType,
  AuditLogEvent,
  Guild,
  ChannelType,
  OverwriteType
} from 'discord.js';

const { bold, cursive, inlineCodeBlock } = DiscordFormatter;

export class ModerationLogger {
  private _auditLogs: Map<Snowflake, Snowflake>; // <Guild ID, Auditlog Entry ID>
  private _configManager: ModerationLoggerConfigManager;
  private _client: CoinflipClient;
  private _ignoredChannelTypes: Array<ChannelType>;

  public constructor(client: CoinflipClient) {
    this._auditLogs = new Map<Snowflake, Snowflake>(); // Memory leak needs cleaning up
    this._client = client;
    this._configManager = new ModerationLoggerConfigManager();

    this._ignoredChannelTypes = [
      ChannelType.PrivateThread,
      ChannelType.PublicThread,
      ChannelType.AnnouncementThread,
      ChannelType.DM
    ]
  }

  private _convertDJSType({ type }: GuildChannel): ResolvedChannelTypeUnion {
    return type === ChannelType.GuildCategory
      ? 'Category'
      : type === ChannelType.GuildNews
        ? 'News'
        : type === ChannelType.GuildStageVoice
          ? 'Stage'
          : type === ChannelType.GuildText
            ? 'Text'
            : type === ChannelType.GuildVoice
              ? 'Voice'
              : 'UNSUPPORTED_CHANNEL_TYPE'
  }

  private _firstLetterToUpperCase(str: string): string {
    return str.replace(/\b(\w)/, char => char.toUpperCase());
  }

  private _convertBitratetoKBPS(bitrate: number): number {
    return bitrate / 1000;
  }

  private _convertBoolToStr(bool: boolean): string {
    return this._firstLetterToUpperCase(String(bool));
  }

  private _getTagFromAuditLog<TAction extends AuditLogEvent, TActionType extends 'Update' | 'Create' | 'Delete', TTargetType extends GuildAuditLogsTargetType>(log: GuildAuditLogsEntry<TAction, TActionType, TTargetType>): string {
    return log?.executor.tag ?? 'USR_FETCH_ERR';
  }

  private _getAvatarFromAuditLog<TAction extends AuditLogEvent, TActionType extends 'Update' | 'Create' | 'Delete', TTargetType extends GuildAuditLogsTargetType>(log: GuildAuditLogsEntry<TAction, TActionType, TTargetType>): string | null {
    return log?.executor.displayAvatarURL();
  }

  private _formatRawDJSPermissionString(perm: PermissionsString): string {
    return perm
      .replace(/_/g, ' ')
      .replace(/\b(\w)/g, char => char.toUpperCase());
  }

  private _getLastAuditLogID(guildID: Snowflake): Snowflake {
    const log = this._auditLogs.get(guildID);

    this._auditLogs.delete(guildID);

    return log;
  }

  private _assignAuditLogEntry<TAction extends AuditLogEvent, TActionType extends 'All' | 'Update' | 'Create' | 'Delete', TTargetType extends GuildAuditLogsTargetType>(guildID: Snowflake, log: GuildAuditLogsEntry<TAction, TActionType, TTargetType>): void {
    this._auditLogs.set(guildID, log?.id ?? this._auditLogs.get(guildID));
  }

  private async _log(guildID: Snowflake, embed: LogEmbed): Promise<void> {
    try {
      const hook = await this._getWebHook(guildID);

      if(hook) {
        hook.send({ embeds: [ embed ]});
      }
    } catch (err) {
      throw err;
    }
  }

  private async _findAuditLog<TAction extends AuditLogEvent>(guild: Guild, type: TAction): Promise<GuildAuditLogsEntry<TAction>> {
    const guildID = guild.id;

    const lastLog = this._getLastAuditLogID(guildID);
    const logs = await guild.fetchAuditLogs({ type });

    const log = logs.entries.find(log => log.id !== lastLog);

    return log;
  }

  private async _getWebHook(guildID: Snowflake): Promise<Webhook> {
    try {
      const cfg = await this._configManager.getConfig(guildID);

      if(cfg?.logChannelID) {
        const guild = await this._client.guilds.fetch(guildID);
        const channel = await guild.channels.fetch(cfg.logChannelID) as TextChannel;

        const webHooks = await channel.fetchWebhooks();
        const hook = webHooks.find(hook => hook.owner.id === this._client.user.id);

        return hook ?? await channel.createWebhook({ name: 'CozyBot Moderation Logger' });
      }
    } catch (err) {
      this.handleError(err);
    }
  }

  public hasGuildLog(guildID: Snowflake): boolean {
    return this._auditLogs.has(guildID);
  }

  public async handleChannelCreate(channel: GuildChannel): Promise<void> {
    const { type: rawType, name, guild, guildId } = channel;

    if(this._ignoredChannelTypes.includes(rawType)) { // Ignore threads and DMs
      return;
    }

    try {
      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.ChannelCreate);

      const type = this._convertDJSType(channel);
      const tag = this._getTagFromAuditLog(auditLogEntry);
      const category = channel?.parent?.name ?? 'No Category';

      const authorStr = type === 'Category'
        ? `Category "${name}" has been created by ${tag}`
        : `${type} channel "${name}" has been created by ${tag}`;

      let descriptionStr: string;

      if(channel instanceof VoiceChannel) {
        const bitrate = this._convertBitratetoKBPS(channel?.bitrate);
        const rtcRegion = channel?.rtcRegion === null ? 'Automatic' : this._firstLetterToUpperCase(channel?.rtcRegion);

        descriptionStr = stripIndent(`
          ${bold('Category')}: ${inlineCodeBlock(category)}
          ${bold('Bitrate')}: ${inlineCodeBlock(`${bitrate}kbps`)}
          ${bold('Region')}: ${inlineCodeBlock(rtcRegion)}
        `).replace(/\n/, '');
      } else if(channel instanceof TextChannel) {
        descriptionStr = stripIndent(`
          ${bold('Category')}: ${inlineCodeBlock(category)}
          ${bold('NSFW')}: ${inlineCodeBlock(this._convertBoolToStr(channel.nsfw))}
        `);
      }

      const embed = new LogEmbed(ModerationLoggerLevel.LOW)
        .setAuthor({ name: authorStr, iconURL: this._getAvatarFromAuditLog(auditLogEntry) })
        .setDescription(descriptionStr);

      this._log(guildId, embed);
      this._assignAuditLogEntry(guildId, auditLogEntry);
    } catch (err) {
      this.handleError(err);
    }
  }

  public async handleChannelDelete(channel: NonThreadGuildBasedChannel): Promise<void> {
    const { type: rawType, name, guild, guildId } = channel;

    if(this._ignoredChannelTypes.includes(rawType)) { // Ignore threads and DMs
      return;
    }

    try {
      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.ChannelDelete)

      const type = this._convertDJSType(channel);
      const tag = this._getTagFromAuditLog(auditLogEntry);

      const authorStr = type === 'Category'
        ? `Category "${name}" has been deleted by ${tag}`
        : `${type} channel "${name}" has been deleted by ${tag}`;

      const embed = new LogEmbed(ModerationLoggerLevel.MEDIUM)
        .setAuthor({ name: authorStr, iconURL: this._getAvatarFromAuditLog(auditLogEntry) });

      this._log(guildId, embed)
      this._assignAuditLogEntry(guildId, auditLogEntry);
    } catch (err) {
      this.handleError(err);
    }
  }

  public async handleChannelUpdate(oldChannel: GuildChannel, newChannel: GuildChannel): Promise<void> {
    if(this._ignoredChannelTypes.includes(oldChannel.type)) { // Ignore anything but any variation of a text channel except threads
      return;
    }

    // I dont like it either 😫
    const { guild, guildId } = oldChannel;

    const diff = [];

    try {
      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.ChannelUpdate)

      const oldChPerms = [...oldChannel.permissionOverwrites.cache];
      const newChPerms = [...newChannel.permissionOverwrites.cache];

      if(oldChPerms.length < newChPerms.length) { // A new override was created.
        const newOverride = newChPerms[newChPerms.length -1][1];

        if(newOverride.type === OverwriteType.Member) {
          const { tag } = newChannel.guild.members.resolve(newOverride.id).user;

          diff[diff.length] = `Added an override for ${inlineCodeBlock(tag)}`;
        } else {
          const { name } = newChannel.guild.roles.resolve(newOverride.id);

          diff[diff.length] = `Added an override for ${inlineCodeBlock(name)}`;
        }
      } else if(oldChPerms.length > newChPerms.length) { // A permission override was removed.
        const removedOverride = oldChPerms.reduce((_, override) => {
          if(!newChPerms.includes(override)) {
            return override;
          }
        })[1];

        if(removedOverride.type === OverwriteType.Member) {
          const { tag } = newChannel.guild.members.resolve(removedOverride.id).user;

          diff[diff.length] = `Removed an override for ${inlineCodeBlock(tag)}`;
        } else {
          const { name } = newChannel.guild.roles.resolve(removedOverride.id)

          diff[diff.length] = `Removed an override for ${inlineCodeBlock(name)}`;
        }
      } else { // An override was edited, oldChPerms and newChPerms length are equal.
        for(let i = 0; i < oldChPerms.length; i++) {
          const oldPerms = oldChPerms[i][1];
          const newPerms = newChPerms[i][1];

          if(oldPerms.allow.bitfield !== newPerms.allow.bitfield || oldPerms.deny.bitfield !== newPerms.deny.bitfield) {
            // I dont like it this time either 😢
            const permArr = [];
            const logPermArr = [];

            const { type } = newPerms;
            const name = newPerms.type === OverwriteType.Member
              ? newChannel.guild.members.resolve(newPerms.id).user.tag
              : newChannel.guild.roles.resolve(newPerms.id).name;

            const oldAllow = oldPerms.allow.serialize(true);
            const oldDeny = oldPerms.deny.serialize(true);

            const newAllow = newPerms.allow.serialize(true);
            const newDeny = newPerms.deny.serialize(true);

            for(const key in newAllow) {
              const formattedPermissionKey = this._formatRawDJSPermissionString(key as PermissionsString);

              const isNewAllowed = newAllow[key];
              const isOldAllowed = oldAllow[key];

              const isNewDenied = newDeny[key];
              const isOldDenied = oldDeny[key];

              // I hope no one sees this ^_^
              if(isNewDenied && !isOldDenied && isOldAllowed) { // Allowed to denied
                permArr[permArr.length] = `Set ${inlineCodeBlock(formattedPermissionKey)} from ✅ to ❌`;
              } else if(!isNewAllowed && !isNewDenied && isOldAllowed) { // Allowed to neutral
                permArr[permArr.length] = `Set ${inlineCodeBlock(formattedPermissionKey)} from ✅ to ➖`;
              } else if(isNewAllowed && !isOldAllowed && isOldDenied) { // Denied to allowed
                permArr[permArr.length] = `Set ${inlineCodeBlock(formattedPermissionKey)} from ❌ to ✅`;
              } else if(!isNewAllowed && !isNewDenied && isOldDenied) { // Denied to neutral
                permArr[permArr.length] = `Set ${inlineCodeBlock(formattedPermissionKey)} from ❌ to ➖`;
              } else if(isNewAllowed && !isOldAllowed && !isOldDenied) { // Neutral to Allowed
                permArr[permArr.length] = `Set ${inlineCodeBlock(formattedPermissionKey)} from ➖ to ✅`;
              } else if(isNewDenied && !isOldDenied && !isOldAllowed) { // Neutral to denied
                permArr[permArr.length] = `Set ${inlineCodeBlock(formattedPermissionKey)} from ➖ to ❌`;
              }
            }

            diff[diff.length] = `Changed permissions for the ${type} ${inlineCodeBlock(name)}:\n  - ${permArr.join('\n  - ')}`;
          }
        }
      }

      if(oldChannel.name !== newChannel.name) {
        diff[diff.length] = `Changed the name from ${bold(oldChannel.name)} to ${bold(newChannel.name)}`
      }

      if(oldChannel.position !== newChannel.position) { // Channel was moved
        if(oldChannel.parentId !== newChannel.parentId) {
          const oldCategory = oldChannel?.parent?.name ?? 'being uncategorized';

          diff[diff.length] = `Moved to the category ${bold(newChannel.parent.name)} from ${bold(oldCategory)}`;
        } else return; // Ignore if the channel wasn't moved to another category
      }

      if(oldChannel instanceof TextChannel && newChannel instanceof TextChannel) {
        if(oldChannel.nsfw !== newChannel.nsfw) {
          const oldNSFW = this._convertBoolToStr(oldChannel.nsfw);
          const newNSFW = this._convertBoolToStr(newChannel.nsfw);

          diff[diff.length] = `Set the NSFW check to ${bold(oldNSFW)} from ${newNSFW}`;
        }

        if(oldChannel.topic !== newChannel.topic) {
          const [ oldTopic, newTopic ] = [oldChannel.topic, newChannel.topic];

          if(((oldTopic?.length ?? 0) + (newTopic?.length ?? 0) + Util.getCombinedStringArrayLength(diff)) <= 4082 - (3 * diff.length)) {
            diff[diff.length] = `Topic changed from:\n"${cursive(oldTopic)}" to:\n"${cursive(newTopic)}"`;
          }
        }

        if(oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
          const diffStr = `Set slowmode to ${bold(newChannel.rateLimitPerUser)} seconds from ${bold(oldChannel.rateLimitPerUser)}`;

          if(diffStr.length + Util.getCombinedStringArrayLength(diff) < 4096 - (3 * diff.length)) {
            diff[diff.length] = diffStr;
          }
        }
      } else if(oldChannel instanceof VoiceChannel && newChannel instanceof VoiceChannel) {
        if(oldChannel.bitrate !== newChannel.bitrate) {
          const oldBitrate = this._convertBitratetoKBPS(oldChannel.bitrate);
          const newBitrate = this._convertBitratetoKBPS(newChannel.bitrate);

          diff[diff.length] = `Bitrate changed from ${bold(`${oldBitrate}kbps`)} to ${bold(`${newBitrate}kbps`)}`;
        }

        if(oldChannel.rtcRegion !== newChannel.rtcRegion) {
          const oldRTC = oldChannel.rtcRegion === null ? 'Automatic' : this._firstLetterToUpperCase(oldChannel.rtcRegion);
          const newRTC = newChannel.rtcRegion === null ? 'Automatic' : this._firstLetterToUpperCase(newChannel.rtcRegion);

          diff[diff.length] = `Region changed from ${bold(oldRTC)} to ${newRTC}`;
        }
      }

      const tag = this._getTagFromAuditLog(auditLogEntry);
      const changePlural = diff.length > 1 ? 'changes' : 'change';

      const authorStr = `${tag} made ${diff.length} ${changePlural} to "${oldChannel.name}"`;

      const embed = new LogEmbed(ModerationLoggerLevel.MEDIUM)
        .setAuthor({ name: authorStr, iconURL: this._getAvatarFromAuditLog(auditLogEntry) })
        .setDescription(diff.join(`\n`));

      this._log(guildId, embed);
      this._assignAuditLogEntry(guildId, auditLogEntry);
    } catch (err) {
      this.handleError(err);
    }
  }

  public async handleEmojiCreate(emote: GuildEmoji): Promise<void> {
    try {
      const { name, url, guild } = emote;
      const guildID = guild.id;

      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.EmojiCreate);
      const description = `${emote.animated ? bold('Requires Nitro\n') : ''}`;

      const author = emote.author
        ?? await emote.fetchAuthor()
        ?? auditLogEntry.executor;

      const authorStr = `The emote "${name}" has been created by ${author.tag}`;

      const embed = new LogEmbed(ModerationLoggerLevel.LOW)
        .setAuthor({ name: authorStr, iconURL: author.displayAvatarURL() })
        .setImage(url)
        .setDescription(description);

      this._log(guildID, embed);
      this._assignAuditLogEntry(guildID, auditLogEntry);
    } catch(err) {
      this.handleError(err);
    }
  }

  public async handleEmojiDelete(emote: GuildEmoji): Promise<void> {
    const { name, url, guild } = emote;
    const guildID = guild.id;

    try {
      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.EmojiDelete);
      const tag = this._getTagFromAuditLog(auditLogEntry);

      const authorStr = `The emote "${name}" has been deleted by ${tag}`;

      const embed = new LogEmbed(ModerationLoggerLevel.MEDIUM)
        .setAuthor({ name: authorStr, iconURL: this._getAvatarFromAuditLog(auditLogEntry) })
        .setImage(url);

      this._log(guildID, embed);
      this._assignAuditLogEntry(guildID, auditLogEntry);
    } catch(err) {
      if(err.code === 10014 && err.httpStataus === 404) {
        const embed = new LogEmbed(ModerationLoggerLevel.HIGH)
          .setDescription('An emote was deleted but I was unable to retrieve any information about it!');

        this._log(guildID, embed);
      } else {
        this.handleError(err);
      }
    }
  }

  public async handleEmojiUpdate(oldEmote: GuildEmoji, newEmote: GuildEmoji): Promise<void> {
    try {
      const { name: oldName, guild } = oldEmote;
      const { name: newName } = newEmote;
      const guildID = guild.id;

      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.EmojiUpdate);

      if(oldName !== newName) {
        const tag = this._getTagFromAuditLog(auditLogEntry);
        const authorStr = `The emote "${oldName}" has been re-named to "${newName}" by ${tag}`;

        const embed = new LogEmbed(ModerationLoggerLevel.LOW)
          .setAuthor({ name: authorStr, iconURL: this._getAvatarFromAuditLog(auditLogEntry) })
          .setImage(newEmote.url);

        this._log(guildID, embed);
        this._assignAuditLogEntry(guildID, auditLogEntry);
      }
    } catch(err) {
      this.handleError(err);
    }
  }

  public async handleGuildBanAdd(ban: GuildBan): Promise<void> {
    try {
      const { user, reason, guild } = ban;
      const guildID = guild.id;

      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.MemberBanAdd);

      const tag = this._getTagFromAuditLog(auditLogEntry);
      const parsedReason = reason ?? auditLogEntry?.reason ?? 'No Reason Set';

      const authorStr = `"${user.tag}" was banned for "${parsedReason}" by ${tag}`;

      const embed = new LogEmbed(ModerationLoggerLevel.HIGH)
        .setAuthor({ name: authorStr })

      this._log(guildID, embed);
      this._assignAuditLogEntry(guildID, auditLogEntry);
    } catch (err) {
      this.handleError(err);
    }
  }

  public async handleGuildBanRemove(ban: GuildBan): Promise<void> {
    try {
      const { user, reason, guild } = ban;
      const guildID = guild.id;

      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.MemberBanRemove);

      const tag = this._getTagFromAuditLog(auditLogEntry);
      const authorStr = `"${user.tag}" has been un-banned by ${tag}`;

      const embed = new LogEmbed(ModerationLoggerLevel.HIGH)
        .setAuthor({ name: authorStr, iconURL: this._getAvatarFromAuditLog(auditLogEntry) })
        .setDescription(`They were originally banned for the following reason:\n${bold(`"${reason ?? auditLogEntry?.reason ?? 'No Reason Set'}"`)}`);

      this._log(guildID, embed);
      this._assignAuditLogEntry(guildID, auditLogEntry);
    } catch (err) {
      this.handleError(err);
    }
  }

  public async handleRoleCreate(role: Role): Promise<void> {
    try {
      const { hexColor, hoist, mentionable, id, name, guild } = role;
      const guildID = guild.id;

      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.RoleCreate);

      const tag = this._getTagFromAuditLog(auditLogEntry);
      const formattedHoist = this._convertBoolToStr(hoist);
      const formattedMentionable = this._convertBoolToStr(mentionable);

      const authorStr = `A new role was just created by ${tag}`;

      const descriptionStr = stripIndent(`
        ${bold('Name')}: ${inlineCodeBlock(name)}
        ${bold('Color')}: ${inlineCodeBlock(hexColor)}
        ${bold('Hoist')}: ${inlineCodeBlock(this._firstLetterToUpperCase(formattedHoist))}
        ${bold('Mentionable')}: ${inlineCodeBlock(formattedMentionable)}
        ${bold('ID')}: ${inlineCodeBlock(id)}
      `);

      const embed = new LogEmbed(ModerationLoggerLevel.LOW)
        .setAuthor({ name: authorStr, iconURL: this._getAvatarFromAuditLog(auditLogEntry) })
        .setDescription(descriptionStr);

      this._log(guildID, embed);
      this._assignAuditLogEntry(guildID, auditLogEntry);
    } catch (err) {
      this.handleError(err);
    }
  }

  public async handleRoleDelete(role: Role): Promise<void> {
    try {
      const { hexColor, hoist, id, name, mentionable, guild } = role;
      const guildID = guild.id;

      const formattedHoist = this._convertBoolToStr(hoist);
      const formattedMentionable = this._convertBoolToStr(mentionable);

      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.RoleDelete);

      const embed = new LogEmbed(ModerationLoggerLevel.LOW)
        .setAuthor({ name: `The role "${name}" was just deleted by ${this._getTagFromAuditLog(auditLogEntry)}`, iconURL: this._getAvatarFromAuditLog(auditLogEntry) })
        .setDescription(stripIndent(`
          ${bold('Color')}: ${inlineCodeBlock(hexColor)}
          ${bold('Hoist')}: ${inlineCodeBlock(formattedHoist)}
          ${bold('Mentionable')}: ${inlineCodeBlock(formattedMentionable)}
          ${bold('ID')}: ${inlineCodeBlock(id)}
        `));

      this._log(guildID, embed);
      this._assignAuditLogEntry(guildID, auditLogEntry);
    } catch (err) {
      this.handleError(err);
    }
  }

  public async handleRoleUpdate(oldRole: Role, newRole: Role): Promise<void> {
    if(oldRole.position !== newRole.position || oldRole.rawPosition !== newRole.rawPosition) {
      return;
    }

    try {
      const { name: oldName, hexColor: oldHex, guild } = oldRole;
      const { name: newName, hexColor: newHex } = newRole;
      const guildID = guild.id;

      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.RoleUpdate);

      let count = 0;
      const diff = [];

      const [ oldHoist, newHoist ] = [oldRole.hoist, newRole.hoist]
        .map(hoist => this._convertBoolToStr(hoist));

      const [ oldMentionable, newMentionable ] = [oldRole.mentionable, newRole.mentionable]
        .map(mentionable => this._convertBoolToStr(mentionable));


      if(oldName !== newName) {
        diff[count++] = `Changed name from ${bold(oldName)} to ${bold(newName)}`;
      }

      if(oldHex !== newHex) {
        diff[count++] = `Changed color from ${bold(oldHex)} to ${bold(newHex)}`;
      }

      if(oldHoist !== oldHoist) {
        diff[count++] = `Changed hoist from ${bold(oldHoist)} to ${bold(newHoist)}`;
      }

      if(oldMentionable !== newMentionable) {
        diff[count++] = `Changed mentionable from ${bold(oldMentionable)} to ${bold(newMentionable)}`;
      }

      if(oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
        const oldPermObj = oldRole.permissions.serialize(true);
        const newPermObj = newRole.permissions.serialize(true);

        const permArr = [];
        const logPermArr = [];
        let count = 0;

        for(const key in oldPermObj) {
          const oldPerm = oldPermObj[key];
          const newPerm = newPermObj[key];
          const formattedPermissionKey = this._formatRawDJSPermissionString(key as PermissionsString);

          if(!oldPerm && newPerm) { // Denied to allowed
            permArr[count++] = `Set ${inlineCodeBlock(formattedPermissionKey)} from ❌ to ✅`;
          } else if(oldPerm && !newPerm) { // Allowed to denied
            permArr[count++] = `Set ${inlineCodeBlock(formattedPermissionKey)} from ✅ to ❌`;
          }
        }

        diff[diff.length] = `Changed permissions:\n  - ${permArr.join('\n  - ')}`;
      }

      const embed = new LogEmbed(ModerationLoggerLevel.LOW)
        .setAuthor({ name: `The role "${oldRole.name}" was just edited by ${this._getTagFromAuditLog(auditLogEntry)}`, iconURL: this._getAvatarFromAuditLog(auditLogEntry) })
        .setDescription(diff
          .map(str => str.length >= 35 ? `${str}\n` : str)
          .join('\n')
        );

      this._log(guildID, embed);
      this._assignAuditLogEntry(guildID, auditLogEntry);
    } catch (err) {
      this.handleError(err);
    }
  }

  public async handleStickerCreate(sticker: Sticker): Promise<void> {
    try {
      const { name, format, url, id, description, guild, guildId } = sticker;

      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.StickerCreate);

      const author = sticker.user
        ?? await sticker.fetchUser()
        ?? auditLogEntry.executor;

      const embed = new LogEmbed(ModerationLoggerLevel.LOW)
        .setAuthor({ name: `The sticker "${name} was just created by "${author.tag}`, iconURL: author.displayAvatarURL() })
        .setImage(url)
        .setDescription(stripIndent(`
          ${bold('Format')}: ${inlineCodeBlock(format)}
          ${bold('ID')}: ${inlineCodeBlock(id)}
          ${bold('Description')}: ${inlineCodeBlock(description)}
        `));

      this._log(guildId, embed);
      this._assignAuditLogEntry(guildId, auditLogEntry);
    } catch(err) {
      this.handleError(err);
    }
  }

  public async handleStickerUpdate(oldSticker: Sticker, newSticker: Sticker): Promise<void> {
    // Sticker title 30 char max
    // Sticker description 100 char max
    // Emoji title 32 char max

    try {
      const { name: oldName, description: oldDescription, guild, guildId } = oldSticker;
      const { name: newName, description: newDescription } = newSticker;

      let count = 0;
      const diff = [];

      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.StickerUpdate);

      if(oldName !== newName) {
        diff[count++] = `Changed name from ${bold(oldName)} to ${bold(newName)}`;
      }

      if(oldDescription !== newDescription) {
        diff[count++] = `Changed description:\n${cursive(`"${oldDescription}"`)}\n${cursive(`"${newDescription}"`)}`;
      }

      const embed = new LogEmbed(ModerationLoggerLevel.MEDIUM)
        .setAuthor({ name: `The sticker "${oldSticker.name}" was just edited by ${this._getTagFromAuditLog(auditLogEntry)}`, iconURL: this._getAvatarFromAuditLog(auditLogEntry) })
        .setDescription(diff
          .map(str => str.length >= 35 ? `${str}\n` : str)
          .join('\n')
        );

      this._log(guildId, embed);
      this._assignAuditLogEntry(guildId, auditLogEntry);
    } catch(err) {
      this.handleError(err);
    }
  }

  public async handleStickerDelete(sticker: Sticker): Promise<void> {
    const { name, format, id, description, guild, guildId } = sticker;

    try {
      const auditLogEntry = await this._findAuditLog(guild, AuditLogEvent.StickerDelete);

      const embed = new LogEmbed(ModerationLoggerLevel.MEDIUM)
        .setAuthor({ name: `The sticker "${name}" was just deleted by ${this._getTagFromAuditLog(auditLogEntry)}`, iconURL: this._getAvatarFromAuditLog(auditLogEntry) })
        .setDescription(stripIndent(`
          ${bold('Format')}: ${inlineCodeBlock(format)}
          ${bold('ID')}: ${inlineCodeBlock(id)}
          ${bold('Description')}: ${inlineCodeBlock(description)}
        `));

      this._log(guildId, embed);
      this._assignAuditLogEntry(guildId, auditLogEntry);
    } catch (err) {
      this.handleError(err);
    }
  }

  public handleMessageDelete(message: Message): void {
    this._configManager.getConfig(message.guildId).then(cfg => {
      if(cfg?.logChannelID && message.channel.id === cfg.logChannelID  || !(message.channel instanceof TextChannel) || !message.guild) return;

      const embed = new LogEmbed(ModerationLoggerLevel.LOW)
        .setAuthor({ name: `Deleted message from ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setDescription(`${bold('Channel')}: ${inlineCodeBlock(message.channel.name)}`);

      const attachments = message.attachments.map(attachment => attachment.url);

      // Atleast one attachment was attached to this message
      // And the channel is not an nsfw channel
      if(attachments.length && !message.channel.nsfw) {
        embed.setImage(attachments.shift());
      }

      embed.addFields({ name: 'Content', value: message.content || 'NO_CONTENT', inline: false });

      // More than 1 attachments were attached to the message.
      // This would be 0 which is a falsy number if there was
      // only one because of the attachments.shift() above.
      if(attachments.length) {
        embed.addFields({ name: 'Media', value: attachments.join('\n'), inline: false });
      }

      this._log(message.guildId, embed);
    }).catch((err: unknown) => this.handleError(err));
  }

  private handleError(err: Error | unknown): void {
    throw err;
  }
}
