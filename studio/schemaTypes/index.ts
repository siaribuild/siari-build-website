import {blockContent} from './blockContent'

import {
  heroHome,
  heroInner,
  featuredProjects,
  projectsGrid,
  cardGrid,
  cardGridText,
  textImage,
  ourStory,
  testimonialsBlock,
  ctaBlock,
  contactFormBlock,
  mapBlock,
} from './blocks'

import {projectCategory} from './projectCategory'
import {project} from './project'
import {testimonial} from './testimonial'
import {siteSettings} from './siteSettings'
import {navigation} from './navigation'
import {contactSubmission} from './contactSubmission'
import {page} from './page'
import {richTextBlock} from './richTextBlock'

export const schemaTypes = [
  blockContent,

  heroHome,
  heroInner,
  featuredProjects,
  projectsGrid,
  cardGrid,
  cardGridText,
  textImage,
  ourStory,
  testimonialsBlock,
  ctaBlock,
  contactFormBlock,
  mapBlock,
  richTextBlock,

  page,
  projectCategory,
  project,
  testimonial,
  siteSettings,
  navigation,
  contactSubmission,
]
