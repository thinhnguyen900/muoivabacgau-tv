export class LivingWorldModel {
  constructor(context='buổi sáng'){
    this.context=context;
    this.childPresent=false;
    this.engagement=0;
    this.state='idle';
    this.story='xếp sách';
    this.memories=['Bác đang xếp sách'];
  }
  arrive(){
    this.childPresent=true;
    this.engagement+=2;
    this.state='notice';
    this.story='Muối vừa về';
    this.memories.push('Muối vừa về nhà');
    return 'Không mở đầu bằng bài học';
  }
  talk(){
    this.engagement+=3;
    this.state='listening';
    return this.childPresent ? 'Bác nhớ Muối vừa về và còn đang xếp sách dở' : 'Chưa xác nhận Muối có mặt';
  }
  knock(){
    this.engagement+=2;
    this.state='interrupted';
    this.story='Thỏ ghé chơi';
    this.memories.push('Thỏ xám vừa ghé chơi');
    return 'Event chen vào nhưng continuity vẫn giữ';
  }
}
