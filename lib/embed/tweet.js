import {defineElement, height, parseHostname} from '../util'
import CSS from './tweet.scss'
import Embed from '../embed'
import Observable from '../observable'

class Tweet extends Observable(Embed) {
  constructor(status, parent) {
    super()
    if (status) this.setAttribute('status', status)
    this.parent = parent

    this.on('initialized', () => { this.appendAnsweredTweet() })
    this.on('initialized', () => { this.fitCardHeight() })
  }

  appendAnsweredTweet() {
    if (!this.isReply) return
    const answered = new Tweet(this.answeredTweetId, this)
    answered.classList.add('answered')
    this.shadowRoot.insertBefore(answered, this.shadowRoot.firstChild)
  }

  fitCardHeight() {
    if (!this.hasLinks) return
    const section = this.shadowRoot.querySelector('#links')
    const p = section.querySelector('p')

    if (!p) return

    const imgHeight = height(section.querySelector('img'))
    let counter = 0
    let last = ''
    while ((height(section) - 2) > imgHeight) {
      if (++counter > 200) break
      if (last === p.innerText) break
      last = p.innerText
      p.innerText = p.innerText.replace(/\W*\s(\S)*$/, '') + '…'
    }
  }

  get answeredTweets() {
    return this.shadowRoot.querySelectorAll('embetty-tweet')
  }

  get url() {
    return this._api(`/tweet/${this.getAttribute('status')}`)
  }

  get twitterUrl() {
    return `https://twitter.com/statuses/${this._data.id_str}`
  }

  get createdAt() {
    let createdAt = this._data.created_at.replace(/\+\d{4}\s/, '') // FU IE11
    return new Date(createdAt)
  }

  get profileImageUrl() {
    return `${this.url}-profile-image`
  }

  get linkImageUrl() {
    return `${this.url}-link-image`
  }

  get fullText() {
    return this._data.full_text
      .replace(/#(\w+)/g, (hashTag, word) => {
        return `<a href="https://twitter.com/hashtag/${word}">${hashTag}</a>`
      })
      .replace(/@(\w+)/g, (name, word) => {
        return `<a href="https://twitter.com/${word}">${name}</a>`
      })
      .replace(/(https:\/\/[^\s]+)$/, link => {
        if (this.hasMedia && this.media[0].url === link) return ''
        return link
      })
  }

  get userName() {
    return this._data.user.name
  }

  get screenName() {
    return this._data.user.screen_name
  }

  get media() {
    const extended = this._data.extended_entities || {}
    const media = extended.media || []
    return media.map((m, idx) => {
      m.imageUrl = `${this.url}-images-${idx}`
      return m
    })
  }

  get hasMedia() {
    return this.media.length > 0
  }

  get links() {
    return this._data.entities.urls
  }

  get link() {
    return this.links[0]
  }

  get linkHostname() {
    return parseHostname(this.link.url)
  }

  get hasLinks() {
    return this.links.length > 0
  }

  get answeredTweetId() {
    return this._data.in_reply_to_status_id_str
  }

  get isReply() {
    return !!this.answeredTweetId
  }

  static get css() {
    return CSS
  }

  static get template() {
    return `
    <style>${CSS}</style>
      <header>
        <img src="{{profileImageUrl}}" />
        <span>
          <strong>{{userName}}</strong>
          <a href="https://twitter.com/{{screenName}}" target="_blank" rel="noopener" >@{{screenName}}</a>
        </span>
      </header>
      <article>
        <p>{{{ fullText }}}</p>
        {{#hasMedia}}
          <section class="media-{{media.length}}" id="media">
            {{#media}}
              <a target="_blank" href="{{imageUrl}}"><img src="{{imageUrl}}"></a>
            {{/media}}
          </section>
        {{/hasMedia}}

        {{#hasLinks}}
          <a href="{{link.url}}" target="_blank" rel="noopener" id="links">
            <img src="{{linkImageUrl}}">
            <section id="link-body">
              <h3>{{link.title}}</h3>
              {{#link.description}}<p>{{link.description}}</p>{{/link.description}}
              <span>{{linkHostname}}</span>
            </section>
          </a>
        {{/hasLinks}}

        <a href="{{twitterUrl}}" target="_blank" rel="noopener" id="created-at">
          <time datetime="{{createdAt.toISOString}}">{{createdAt.toLocaleString}}</time>
          via Twitter
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><style>.cls-1{fill:none;}.cls-2{fill:#1da1f2;}</style></defs><path class="cls-2" d="M153.62,301.59c94.34,0,145.94-78.16,145.94-145.94,0-2.22,0-4.43-.15-6.63A104.36,104.36,0,0,0,325,122.47a102.38,102.38,0,0,1-29.46,8.07,51.47,51.47,0,0,0,22.55-28.37,102.79,102.79,0,0,1-32.57,12.45,51.34,51.34,0,0,0-87.41,46.78A145.62,145.62,0,0,1,92.4,107.81a51.33,51.33,0,0,0,15.88,68.47A50.91,50.91,0,0,1,85,169.86c0,.21,0,.43,0,.65a51.31,51.31,0,0,0,41.15,50.28,51.21,51.21,0,0,1-23.16.88,51.35,51.35,0,0,0,47.92,35.62,102.92,102.92,0,0,1-63.7,22A104.41,104.41,0,0,1,75,278.55a145.21,145.21,0,0,0,78.62,23"/></svg>
        </a>
      </article>
    `
  }
}

defineElement('embetty-tweet', Tweet)